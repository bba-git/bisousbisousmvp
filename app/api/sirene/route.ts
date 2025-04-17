import { NextResponse } from 'next/server';

const SIRENE_API_URL = 'https://api.insee.fr/entreprises/sirene/V3/siret';
const SIRENE_API_KEY = process.env.SIRENE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siret = searchParams.get('siret');

  if (!siret) {
    return NextResponse.json(
      { error: 'SIRET number is required' },
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
    const response = await fetch(`${SIRENE_API_URL}/${siret}`, {
      headers: {
        'Authorization': `Bearer ${SIRENE_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: 'Failed to fetch SIRENE data', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract relevant information
    const establishment = data.etablissement;
    const company = data.etablissement.uniteLegale;
    
    return NextResponse.json({
      company_name: company.denominationUniteLegale,
      siret: establishment.siret,
      siren: establishment.siren,
      ape_code: company.activitePrincipaleUniteLegale,
      ape_label: company.activitePrincipaleUniteLegaleLibelle,
      address: {
        street: establishment.adresseEtablissement.numeroVoieEtablissement + ' ' + 
                establishment.adresseEtablissement.typeVoieEtablissement + ' ' + 
                establishment.adresseEtablissement.libelleVoieEtablissement,
        city: establishment.adresseEtablissement.libelleCommuneEtablissement,
        postal_code: establishment.adresseEtablissement.codePostalEtablissement,
        country: 'France'
      }
    });
  } catch (error) {
    console.error('SIRENE API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SIRENE data' },
      { status: 500 }
    );
  }
} 