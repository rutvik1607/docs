export interface IpGeolocationData {
    ipAddress: string;
    location: string;
    city?: string;
    region?: string;
    country?: string;
}

export async function fetchIpGeolocation(): Promise<IpGeolocationData> {
    try {
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            throw new Error('Failed to fetch IP geolocation data');
        }

        const data = await response.json();

        const ipAddress = data.ip || 'Unknown';
        const city = data.city || '';
        const region = data.region || '';
        const country = data.country_name || '';

        const location = [city, region, country]
            .filter(part => part && part.trim())
            .join(', ');

        return {
            ipAddress,
            location: location || 'Unknown',
            city,
            region,
            country
        };
    } catch (error) {
        console.error('Error fetching IP geolocation:', error);

        return {
            ipAddress: 'Unavailable',
            location: 'Unavailable'
        };
    }
}
