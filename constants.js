// Default footnotes for common acronyms used in land use meetings
const DEFAULT_FOOTNOTES = {
    'UDAA': 'Urban Development Action Area - A designation for areas requiring coordinated public action',
    'UDAAP': 'Urban Development Action Area Project - A tax exemption program for rehabilitation or new construction of housing on formerly city-owned land',
    'MIH': 'Mandatory Inclusionary Housing - Requires a share of new housing in rezoned areas to be permanently affordable',
    'SHLP': 'Supportive Housing Loan Program - Loans to developers of permanent supportive housing with on-site social services',
    'ELLA': 'Extremely Low and Low-Income Affordability Program - Funds new construction of low-income multi-family rental projects',
    'AMI': 'Area Median Income - The midpoint of a region\'s income distribution',
    'HPD': 'Department of Housing Preservation and Development',
    'ULURP': 'Uniform Land Use Review Procedure - NYC\'s public review process for land use changes',
    'FAR': 'Floor Area Ratio - The ratio of a building\'s total floor area to the size of the land upon which it is built',
    'CEQR': 'City Environmental Quality Review - NYC\'s environmental review process',
    'DCP': 'Department of City Planning',
    'BSA': 'Board of Standards and Appeals',
    'CPC': 'City Planning Commission',
    'SCRIE': 'Senior Citizen Rent Increase Exemption',
    'DRIE': 'Disability Rent Increase Exemption'
};

// Standard meeting agenda template
const MEETING_AGENDA = `1. Call to Order
2. Roll Call
3. Adoption of Agenda
4. Approval of Minutes
5. Announcements
6. Presentations & Discussions
7. Old Business
8. New Business
9. Roll Call
10. Adjournment

`;

// Common phrase templates
const PHRASE_TEMPLATES = {
    callToOrder: 'Called to order by ___',
    quorum: 'Quorum present',
    adopted: 'Adopted without objection',
    motion: 'Motion to ___ made by ___, seconded by ___',
    carried: 'The motion carried with ___ for, ___ against, ___ present/not voting, and ___ abstentions',
    failed: 'The motion did not carry with ___ for, ___ against, ___ present/not voting, and ___ abstentions'
};