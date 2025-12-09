import { NextRequest, NextResponse } from 'next/server';

// Clearbit Logo API - Free tier available
// Falls back to generating a placeholder with initials if logo not found

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
            .replace(/[^a-z0-9\s]/gi, '')
            .split(' ')[0]; // Take first word for better domain match

        // Common company domain mappings
        const domainMappings: Record<string, string> = {
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
            'mckinsey': 'mckinsey.com',
            'bcg': 'bcg.com',
            'bain': 'bain.com',
            'deloitte': 'deloitte.com',
            'kpmg': 'kpmg.com',
            'pwc': 'pwc.com',
            'ey': 'ey.com',
            'accenture': 'accenture.com',
            'jpmorgan': 'jpmorgan.com',
            'goldman': 'goldmansachs.com',
            'morgan': 'morganstanley.com',
            'blackrock': 'blackrock.com',
            'citadel': 'citadel.com',
            'tcs': 'tcs.com',
            'infosys': 'infosys.com',
            'wipro': 'wipro.com',
            'hcl': 'hcltech.com',
            'cognizant': 'cognizant.com',
            'capgemini': 'capgemini.com',
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
        };

        // Try to find a matching domain
        let domain = domainMappings[cleanedCompany];

        if (!domain) {
            // Try common patterns
            domain = `${cleanedCompany}.com`;
        }

        // Clearbit Logo API URL
        const logoUrl = `https://logo.clearbit.com/${domain}?size=${size}`;

        // Check if logo exists by making a HEAD request
        const response = await fetch(logoUrl, { method: 'HEAD' });

        if (response.ok) {
            return NextResponse.json({
                logoUrl,
                company,
                domain,
                found: true
            });
        } else {
            // Return null logo, will use fallback
            return NextResponse.json({
                logoUrl: null,
                company,
                domain,
                found: false
            });
        }
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
