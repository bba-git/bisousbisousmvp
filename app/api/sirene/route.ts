import { NextResponse } from 'next/server';

const SIRENE_API_URL = 'https://api.insee.fr/api-sirene/3.11/siret';
const SIRENE_API_KEY = process.env.SIRENE_API_KEY;

console.log('SIRENE_API_KEY:', SIRENE_API_KEY ? 'Configured' : 'Not configured');

// Validate SIRET format
function isValidSiret(siret: string): boolean {
  if (!siret || siret.length !== 14) return false;
  return /^\d{14}$/.test(siret);
}

export async function GET(request: Request) {
  console.log('SIRENE API route called');
  const { searchParams } = new URL(request.url);
  const siret = searchParams.get('siret');
  console.log('SIRET:', siret);

  if (!siret) {
    return NextResponse.json(
      { error: 'SIRET number is required' },
      { status: 400 }
    );
  }

  if (!isValidSiret(siret)) {
    return NextResponse.json(
      { error: 'Invalid SIRET format. Must be 14 digits.' },
      { status: 400 }
    );
  }

  if (!SIRENE_API_KEY) {
    return NextResponse.json(
      { error: 'SIRENE API key is not configured' },
      { status: 500 }
    );
  }

  try {
    console.log('Making request to SIRENE API:', `${SIRENE_API_URL}/${siret}`);
    console.log('Headers:', {
      'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
      'Accept': 'application/json'
    });

    const response = await fetch(`${SIRENE_API_URL}/${siret}`, {
      method: 'GET',
      headers: {
        'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      let error;
      try {
        error = JSON.parse(responseText);
      } catch {
        error = { message: responseText };
      }
      console.error('SIRENE API error:', error);
      
      // Handle specific SIRENE API errors
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'SIRET number not found in SIRENE database' },
          { status: 404 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests to SIRENE API. Please try again later.' },
          { status: 429 }
        );
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired API key' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch SIRENE data', details: error },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    console.log('SIRENE API response:', data);
    
    // Extract relevant information with null checks
    const establishment = data.etablissement;
    const company = data.etablissement?.uniteLegale;
    
    if (!establishment || !company) {
      return NextResponse.json(
        { error: 'Invalid SIRENE data structure', details: data },
        { status: 500 }
      );
    }

    // Format address components
    const addressComponents = [
      establishment.adresseEtablissement.numeroVoieEtablissement,
      establishment.adresseEtablissement.typeVoieEtablissement,
      establishment.adresseEtablissement.libelleVoieEtablissement
    ].filter(Boolean).join(' ');

    return NextResponse.json({
      company_name: data.etablissement.uniteLegale.denominationUniteLegale,
      siret: data.etablissement.siret,
      siren: data.etablissement.siren,
      ape_code: data.etablissement.uniteLegale.activitePrincipaleUniteLegale,
      ape_label: data.etablissement.uniteLegale.activitePrincipaleUniteLegaleLibelle,
      address: {
        street: `${data.etablissement.adresseEtablissement.numeroVoieEtablissement} ${data.etablissement.adresseEtablissement.typeVoieEtablissement} ${data.etablissement.adresseEtablissement.libelleVoieEtablissement}`,
        city: data.etablissement.adresseEtablissement.libelleCommuneEtablissement,
        postal_code: data.etablissement.adresseEtablissement.codePostalEtablissement,
        country: 'France'
      },
      legal_status: data.etablissement.uniteLegale.categorieJuridiqueUniteLegale,
      legal_status_label: data.etablissement.uniteLegale.categorieJuridiqueUniteLegaleLibelle,
      creation_date: data.etablissement.dateCreationEtablissement,
      is_active: data.etablissement.periodesEtablissement[0]?.etatAdministratifEtablissement === 'A'
    });
  } catch (error) {
    console.error('SIRENE API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SIRENE data', details: error },
      { status: 500 }
    );
  }
} 