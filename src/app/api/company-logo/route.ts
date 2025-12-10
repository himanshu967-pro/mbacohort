import { NextRequest, NextResponse } from 'next/server';

// Logo.dev API - Uses their CDN for fetching company logos
// API Key is passed as a token parameter

const LOGO_DEV_API_KEY = process.env.LOGO_DEV_API_KEY || 'pk_NjBhh-kLQianpuZp_XrKRA';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const size = searchParams.get('size') || '128';

    if (!company) {
        return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    }

    try {
        // Clean up company name for domain lookup
        const cleanedCompany = company
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/gi, '');

        // Common company domain mappings - expanded with Indian companies
        const domainMappings: Record<string, string> = {
            // Big Tech
            'google': 'google.com',
            'microsoft': 'microsoft.com',
            'amazon': 'amazon.com',
            'meta': 'meta.com',
            'facebook': 'meta.com',
            'apple': 'apple.com',
            'netflix': 'netflix.com',
            'tesla': 'tesla.com',
            'spotify': 'spotify.com',
            'uber': 'uber.com',
            'airbnb': 'airbnb.com',
            'linkedin': 'linkedin.com',
            'twitter': 'twitter.com',
            'x': 'x.com',
            'salesforce': 'salesforce.com',
            'oracle': 'oracle.com',
            'ibm': 'ibm.com',
            'intel': 'intel.com',
            'nvidia': 'nvidia.com',
            'adobe': 'adobe.com',
            'stripe': 'stripe.com',
            'slack': 'slack.com',
            'zoom': 'zoom.us',
            'shopify': 'shopify.com',
            'square': 'squareup.com',
            'paypal': 'paypal.com',
            'dropbox': 'dropbox.com',

            // Consulting & Finance
            'mckinsey': 'mckinsey.com',
            'bcg': 'bcg.com',
            'bain': 'bain.com',
            'deloitte': 'deloitte.com',
            'kpmg': 'kpmg.com',
            'pwc': 'pwc.com',
            'ey': 'ey.com',
            'accenture': 'accenture.com',
            'accenture atci': 'accenture.com',
            'accenture aioc': 'accenture.com',
            'accenture sc': 'accenture.com',
            'accenture tc': 'accenture.com',
            'jpmorgan': 'jpmorgan.com',
            'goldman': 'goldmansachs.com',
            'morgan': 'morganstanley.com',
            'blackrock': 'blackrock.com',
            'citadel': 'citadel.com',
            'exl': 'exlservice.com',
            'exl service': 'exlservice.com',

            // Indian IT/Tech
            'tcs': 'tcs.com',
            'infosys': 'infosys.com',
            'infosys ic': 'infosys.com',
            'wipro': 'wipro.com',
            'hcl': 'hcltech.com',
            'cognizant': 'cognizant.com',
            'capgemini': 'capgemini.com',
            'tech mahindra': 'techmahindra.com',
            'ltimindtree': 'ltimindtree.com',
            'persistent': 'persistent.com',
            'hexaware': 'hexaware.com',
            'realization': 'realization.com',

            // Indian Startups & Consumer
            'flipkart': 'flipkart.com',
            'swiggy': 'swiggy.com',
            'zomato': 'zomato.com',
            'paytm': 'paytm.com',
            'phonepe': 'phonepe.com',
            'razorpay': 'razorpay.com',
            'cred': 'cred.club',
            'byju': 'byjus.com',
            'unacademy': 'unacademy.com',
            'zerodha': 'zerodha.com',
            'groww': 'groww.in',

            // Banks and Financial
            'axis bank': 'axisbank.com',
            'hdfc': 'hdfcbank.com',
            'hdfc bank': 'hdfcbank.com',
            'icici': 'icicibank.com',
            'icici bank': 'icicibank.com',
            'kotak': 'kotak.com',
            'kotak mahindra': 'kotak.com',
            'sbi': 'sbi.co.in',
            'indian bank': 'indianbank.in',

            // Industrial & Manufacturing
            'hilti': 'hilti.com',
            'bosch': 'bosch.com',
            'bosch global': 'bosch.com',
            'sp global': 'spglobal.com',
            's&p global': 'spglobal.com',
            'paharpur': 'paharpurcoolingtowers.com',
            'merkel': 'merkel.de',
            'lifestyle': 'lifestylestores.com',
            'lifestyle international': 'lifestylestores.com',
            'amns india': 'amns.in',
            'amns': 'amns.in',
            'arcelormittal': 'arcelormittal.com',
            'jsw': 'jsw.in',
            'jsw steel': 'jsw.in',
            'tata steel': 'tatasteel.com',
            'tata': 'tata.com',
            'reliance': 'ril.com',
            'reliance industries': 'ril.com',
            'mahindra': 'mahindra.com',
            'bajaj': 'bajaj.com',
            'larsen': 'larsentoubro.com',
            'larsen toubro': 'larsentoubro.com',
            'lt': 'larsentoubro.com',
            'asian paints': 'asianpaints.com',
            'hindustan unilever': 'hul.co.in',
            'itc': 'itcportal.com',
            'nestle': 'nestle.com',
        };

        // Try to find a matching domain (check full name first, then individual words)
        let domain = domainMappings[cleanedCompany];

        if (!domain) {
            // Try first word
            const firstWord = cleanedCompany.split(' ')[0];
            domain = domainMappings[firstWord];
        }

        if (!domain) {
            // Try first two words
            const firstTwoWords = cleanedCompany.split(' ').slice(0, 2).join(' ');
            domain = domainMappings[firstTwoWords];
        }

        if (!domain) {
            // Try common patterns - use first significant word
            const significantWord = cleanedCompany.split(' ').find(w => w.length > 2) || cleanedCompany.split(' ')[0];
            domain = `${significantWord}.com`;
        }

        // Logo.dev CDN URL - simple and direct
        const logoUrl = `https://img.logo.dev/${domain}?token=${LOGO_DEV_API_KEY}&size=${size}&format=png`;

        // Logo.dev handles everything via CDN, just return the URL
        // The CDN will return a placeholder if logo not found
        return NextResponse.json({
            logoUrl,
            company,
            domain,
            found: true
        });

    } catch (error) {
        console.error('Error fetching company logo:', error);
        return NextResponse.json({
            logoUrl: null,
            company,
            found: false,
            error: 'Failed to fetch logo'
        });
    }
}
