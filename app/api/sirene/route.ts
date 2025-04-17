import { NextResponse } from 'next/server';

const SIRENE_API_URL = 'https://api.insee.fr/api-sirene/3.11/siret';
const SIRENE_API_KEY = 'ef79b386-e02a-429e-b9b3-86e02ab29e4d';

console.log('SIRENE_API_KEY:', SIRENE_API_KEY ? 'Configured' : 'Not configured');

// Validate SIRET format
function isValidSiret(siret: string): boolean {
  if (!siret || siret.length !== 14) return false;
  return /^\d{14}$/.test(siret);
}

export async function GET(request: Request) {
  console.log('SIRENE_API_KEY:', SIRENE_API_KEY);
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
    console.log('Making request to:', `${SIRENE_API_URL}/${siret}`);
    const response = await fetch(`${SIRENE_API_URL}/${siret}`, {
      method: 'GET',
      headers: {
        'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch SIRENE data', details: responseText },
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

    return NextResponse.json({
      company_name: establishment.uniteLegale.denominationUniteLegale,
      siret: establishment.siret,
      siren: establishment.siren,
      ape_code: establishment.uniteLegale.activitePrincipaleUniteLegale,
      ape_label: establishment.uniteLegale.activitePrincipaleUniteLegale,
      address: {
        street: `${establishment.adresseEtablissement.numeroVoieEtablissement} ${establishment.adresseEtablissement.typeVoieEtablissement} ${establishment.adresseEtablissement.libelleVoieEtablissement}`,
        city: establishment.adresseEtablissement.libelleCommuneEtablissement,
        postal_code: establishment.adresseEtablissement.codePostalEtablissement,
        country: 'France'
      },
      legal_status: establishment.uniteLegale.categorieJuridiqueUniteLegale,
      legal_status_label: establishment.uniteLegale.categorieJuridiqueUniteLegale,
      creation_date: establishment.dateCreationEtablissement,
      is_active: establishment.periodesEtablissement[0]?.etatAdministratifEtablissement === 'A'
    });
  } catch (error) {
    console.error('SIRENE API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SIRENE data', details: error },
      { status: 500 }
    );
  }
} 