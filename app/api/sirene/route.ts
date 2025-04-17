import { NextResponse } from 'next/server';

const SIRENE_API_KEY = process.env.SIRENE_API_KEY;
const SIRENE_API_URL = 'https://api.insee.fr/api-sirene/3.11/siret';

console.log('SIRENE_API_KEY:', SIRENE_API_KEY ? 'Configured' : 'Not configured');

// Validate SIRET format
function isValidSiret(siret: string): boolean {
  if (!siret || siret.length !== 14) return false;
  return /^\d{14}$/.test(siret);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siret = searchParams.get('siret');

  if (!siret) {
    return NextResponse.json({ error: 'SIRET number is required' }, { status: 400 });
  }

  if (!isValidSiret(siret)) {
    return NextResponse.json(
      { error: 'Invalid SIRET format. Must be 14 digits.' },
      { status: 400 }
    );
  }

  if (!SIRENE_API_KEY) {
    console.error('SIRENE_API_KEY is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    console.log('SIRENE API route called');
    console.log('SIRET:', siret);
    console.log('Making request to SIRENE API:', `${SIRENE_API_URL}/${siret}`);

    const response = await fetch(`${SIRENE_API_URL}/${siret}`, {
      headers: {
        'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
        'accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch SIRENE data' }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract relevant information with null checks
    const establishment = data.etablissement;
    const company = data.etablissement?.uniteLegale;
    
    if (!establishment || !company) {
      return NextResponse.json(
        { error: 'Invalid SIRENE data structure' },
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
    return NextResponse.json({ error: 'Failed to fetch SIRENE data' }, { status: 500 });
  }
} 