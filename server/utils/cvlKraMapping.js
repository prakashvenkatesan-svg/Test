/**
 * Utility function to map human-readable user input to CVL KRA API payload format.
 * Translates values into the strictly required codes, handling edge cases like Aadhaar ID vs Address proof.
 */

const ID_PROOF_MAP = {
    'pan': '01',
    'aadhaar': '02',
    'uid no.': '02',
    'uid': '02',
    'passport': '03',
    'driving license': '04',
    'voter identity card': '05',
    'voter id': '05',
    'other id proof': '16',
    'other': '16'
};

const ADDRESS_PROOF_MAP = {
    'passport': '01',
    'driving license': '02',
    'latest bank passbook': '03',
    'bank passbook': '03',
    'latest bank account statement': '04',
    'bank account statement': '04',
    'bank statement': '04',
    'voter identity card': '06',
    'voter id': '06',
    'registered lease / sale agreement of residence': '08',
    'lease agreement': '08',
    'sale agreement': '08',
    'aadhaar': '31',
    'uid no.': '31',
    'uid': '31',
    'any other proof of address': '32',
    'other': '32'
};

const MARITAL_STATUS_MAP = {
    'married': '01',
    'unmarried': '02',
    'single': '02'
};

const OCCUPATION_MAP = {
    'private sector service': '01',
    'private sector': '01',
    'public sector': '02',
    'business': '03',
    'professional': '04',
    'agriculturist': '05',
    'agriculture': '05',
    'retired': '06',
    'housewife': '07',
    'student': '08',
    'government service': '10',
    'government': '10',
    'others': '99',
    'other': '99'
};

const INCOME_MAP = {
    'below 1 lac': '01',
    '< 1 lac': '01',
    '1-5 lac': '02',
    '1 to 5 lac': '02',
    '5-10 lac': '03',
    '5 to 10 lac': '03',
    '10-25 lac': '04',
    '10 to 25 lac': '04',
    '>25 lac': '05',
    'more than 25 lac': '05',
    '25 lac - 1 cr': '06',
    '25 lac to 1 cr': '06',
    '>1 cr': '07',
    'more than 1 cr': '07'
};

const RESIDENTIAL_STATUS_MAP = {
    'resident individual': 'R',
    'resident': 'R',
    'non-resident individual': 'N',
    'nri': 'N',
    'foreign national': 'P',
    'foreigner': 'P'
};

function normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().toLowerCase();
}

/**
 * Maps standard human-readable inputs to CVL KRA structured JSON payload
 * @param {Object} input - User input containing human-readable values
 * @returns {Object} Perfectly formatted JSON payload for CVL KRA API
 */
function mapToCvlKraPayload(input) {
    const payload = {};

    // 1. Identity Proof
    if (input.identityProof) {
        const normalized = normalizeString(input.identityProof);
        payload.APP_EXMT_ID_PROOF = ID_PROOF_MAP[normalized] || '16'; // Default to '16' (OTHER ID PROOF)
    }

    // 2. Address Proof (maps to both APP_COR_ADD_PROOF and APP_PER_ADD_PROOF by default)
    if (input.addressProof) {
        const normalized = normalizeString(input.addressProof);
        const mappedProof = ADDRESS_PROOF_MAP[normalized] || '32'; // Default to '32' (ANY OTHER PROOF)
        payload.APP_COR_ADD_PROOF = mappedProof;
        payload.APP_PER_ADD_PROOF = mappedProof;
    }
    
    // Explicit overrides for separate correspondence/permanent proofs if provided
    if (input.corAddressProof) {
        payload.APP_COR_ADD_PROOF = ADDRESS_PROOF_MAP[normalizeString(input.corAddressProof)] || '32';
    }
    if (input.perAddressProof) {
        payload.APP_PER_ADD_PROOF = ADDRESS_PROOF_MAP[normalizeString(input.perAddressProof)] || '32';
    }

    // 3. Marital Status
    if (input.maritalStatus) {
        const normalized = normalizeString(input.maritalStatus);
        payload.APP_MAR_STATUS = MARITAL_STATUS_MAP[normalized] || '02'; // Default '02' (Unmarried)
    }

    // 4. Occupation
    if (input.occupation) {
        const normalized = normalizeString(input.occupation);
        payload.APP_OCC = OCCUPATION_MAP[normalized] || '99'; // Default '99' (OTHERS)
    }

    // 5. Income Slab
    if (input.incomeSlab) {
        const normalized = normalizeString(input.incomeSlab);
        payload.APP_INCOME = INCOME_MAP[normalized] || '01'; // Default '01' (BELOW 1 LAC)
    }

    // 6. Residential Status
    if (input.residentialStatus) {
        const normalized = normalizeString(input.residentialStatus);
        payload.APP_RES_STATUS = RESIDENTIAL_STATUS_MAP[normalized] || 'R'; // Default 'R' (Resident)
    }

    // 7. Hardcoded required flags & logic overrides
    
    // APP_DOC_PROOF must strictly be 'S' (Scanned) or 'P' (Physical)
    payload.APP_DOC_PROOF = input.docProof === 'P' ? 'P' : 'S'; 
    
    // APP_PAN_COPY must be 'Y' or 'N'
    payload.APP_PAN_COPY = input.panCopyProvided === true || input.panCopyProvided === 'Y' ? 'Y' : 'N';
    
    // APP_EXMT must be 'N' (if PAN provided) or 'Y'
    const hasPan = !!input.panNumber && String(input.panNumber).trim().length > 0;
    payload.APP_EXMT = hasPan ? 'N' : 'Y';
    
    // APP_IPV_FLAG must be 'Y', 'N', or 'E'
    const validIpvFlags = ['Y', 'N', 'E'];
    payload.APP_IPV_FLAG = validIpvFlags.includes(input.ipvFlag) ? input.ipvFlag : 'N';
    
    // If PAN is provided, we map it into the payload
    if (hasPan) {
        payload.APP_PAN_NO = input.panNumber.toUpperCase();
    }

    // Retain any fields passed in natively using the uppercase keys 
    // (so developers can still supply exact KRA fields if they want to override)
    for (const [key, value] of Object.entries(input)) {
        if (key === key.toUpperCase() && !payload.hasOwnProperty(key)) {
            payload[key] = value;
        }
    }

    return payload;
}

module.exports = { mapToCvlKraPayload };
