/**
 * Configuration for Setu Flexi eSign positions.
 * This function returns the `signRectangles` required for the Setu `/api/signature/config` endpoint.
 * Coordinates (x, y, width, height) are visually estimated and can be adjusted.
 * Setu's page index is 0-based, so PDF Viewer Page 1 -> pageIndex 0.
 */

const getFlexiEsignPositions = (application) => {
  // Check if DDPI is selected in the application (assuming application.ddpi is a boolean or 'YES'/'NO' string)
  const isDDPISelected = typeof application.ddpi === 'string'
    ? application.ddpi.toUpperCase() === 'YES'
    : !!application.ddpi;

  // Helper to create a rectangle config
  const createRect = (pageIndex, x = 380, y = 30, width = 170, height = 60) => ({
    pageIndex,
    x,
    y,
    width,
    height
  });

  const basePositions = [
    createRect(0, 400, 45, 140, 45),    // Page 1: Applicant e-SIGN (bottom right box)
    createRect(1, 310, 330, 100, 40),   // Page 2: Applicant e-SIGN (middle-top box)
    createRect(9, 120, 30, 115, 40),    // Page 10: SOLE/FIRST HOLDER (bottom table)
    createRect(10, 70, 320, 100, 40),   // Page 11: All Segments (top table, first col)
    createRect(11, 350, 280, 140, 45),  // Page 12: Details of disputes
    createRect(12, 175, 460, 115, 40),  // Page 13: 10/38 under SOLE/FIRST HOLDER (top)
    createRect(12, 155, 30, 115, 40),   // Page 13: 11/38 under SOLE/FIRST HOLDER (bottom)
    createRect(13, 120, 560, 130, 40),  // Page 14: 12/38 beside esign
    createRect(13, 175, 30, 115, 40),   // Page 14: 13/38 beside esign in box inside
    createRect(16, 175, 30, 105, 40),   // Page 17: 14/38 SOLE/FIRST HOLDER
    createRect(17, 175, 115, 115, 40),  // Page 18: 16/38 SOLE/FIRST HOLDER
    createRect(18, 155, 60, 115, 40),   // Page 19: 17/38 SOLE/FIRST HOLDER
    createRect(19, 155, 525, 95, 40),   // Page 20: 18/38 SOLE/FIRST HOLDER
    createRect(19, 160, 440, 95, 40),   // Page 20: 19/38 SOLE/FIRST HOLDER
    createRect(19, 155, 25, 95, 40),    // Page 20: 20/38 SOLE/FIRST HOLDER
    createRect(20, 165, 340, 95, 40),   // Page 21: 21/38 SOLE/FIRST HOLDER
    createRect(20, 165, 180, 95, 40),   // Page 21: 22/38 SOLE/FIRST HOLDER
    createRect(20, 165, 40, 95, 40),    // Page 21: 23/38 SOLE/FIRST HOLDER
    createRect(21, 125, 530, 130, 40),  // Page 22: 24/38 beside esign
    createRect(21, 140, 280, 130, 40),  // Page 22: 25/38 up esign
    createRect(22, 60, 580, 130, 40),   // Page 23: 26/38 up esign
    createRect(22, 60, 60, 130, 40),    // Page 23: 27/38 up esign
    createRect(23, 120, 290, 130, 40),  // Page 24: 28/38 box inside esign
    createRect(27, 140, 330, 130, 40),  // Page 28: 34/38 beside esign
    createRect(30, 120, 605, 130, 40),  // Page 31: 35/38 esign
    createRect(34, 160, 230, 95, 40),   // Page 35: 36/38 SOLE/FIRST HOLDER
    createRect(35, 60, 300, 130, 40),   // Page 36: 37/38 up esign
    createRect(37, 165, 100, 95, 40),   // Page 38: 38/38 SOLE/FIRST HOLDER
  ];

  // Dynamically add extra e-sign positions at bottom-right based on ENV configuration
  if (process.env.EXTRA_ESIGN_PAGES) {
    const extraPages = process.env.EXTRA_ESIGN_PAGES.split(',').map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
    extraPages.forEach(page => {
      // 0-based page index, bottom right coordinate
      basePositions.push(createRect(page - 1, 400, 45, 140, 45));
    });
  }

  // Conditional Page 25 signatures based on DDPI
  if (isDDPISelected) {
    basePositions.push(
      createRect(24, 130, 487, 105, 35), // Page 25: SOLE/FIRST HOLDER 1
      createRect(24, 130, 406, 105, 35), // Page 25: SOLE/FIRST HOLDER 2
      createRect(24, 130, 340, 105, 35), // Page 25: SOLE/FIRST HOLDER 3
      createRect(24, 130, 277, 105, 35)  // Page 25: SOLE/FIRST HOLDER 4
    );
  }

  return basePositions;
};

module.exports = {
  getFlexiEsignPositions
};
