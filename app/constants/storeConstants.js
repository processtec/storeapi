/*jslint node: true */
'use strict';

const storeConst = {
    PTE: {
        IS_WRITE_BACK_ALLOWED: false
    },
    PRODUCT: {
        STATUS: {
            ORDERED: 0, // ordered but not received.
            AVAILABLE: 1, // received and inspected.
            SOLD: 2, // existing
            DAMAGED: 3, // existing
            TEST_EQUIPMENT: 4,// existing
            MAINTENANCE: 5,// existing
            TRIALS: 6,// existing
            UNKNOWN: 7,// existing
            PTE_AVAILABLE_DELETED: 8, // DELETED FROM PTE
            PTE_ORDERED_DELETED: 9 // DELETED FROM PTE
        }
    },
    
    SESSION: {
        JWT: {
            VALIDITY: 86400
        },
        REFRESH_TOKEN: {
            VALIDITY: 186400
        }
    },

    CART: {
      STATUS: {
        AVAILABLE: 1,
        PARTIAL_COMPLETED: 2,
        COMPLETED: 3,
        DELETED: 4,
        UNKNOWN: 5
      }
    },
    REPORT_CART: {
        STATUS: {
            PARTIAL_COMPLETED: 1,
            COMPLETED: 2,
            DELETED: 3
        }
    },
    SHIPMENT: {
        STATUS: {
            UNKNOWN: 0,
            COMPLETED: 1,
            PARTIAL_COMPLETED: 2,
            DELETED: 3
          }
    },

    ES: {
        INDEX_COMPONENTS: "pte_components",// "complete_comps_08_15_2020",
        MAX_RESULTS: 40
    },

    ALERT: {
        TIMEOUT: 2000,
        
        TYPE: {
            CHECKOUT_SUCCESS: 1,
            PARTIAL_CHECKOUT_SUCCESS: 2,
            
            PRODUCT_AVAILABLE: 5,
            PRODUCT_DAMAGED: 6,
            PRODUCT_MAINTENANCE: 7,
            PRODUCT_TESTING: 8,
            PRODUCT_TRIALS: 9,

            USER_CREATED: 11,
            USER_PASSWORD: 12,
            USER_ROLE: 13,

            ERROR_ANY: 25,
            ERROR_PTE_DELETE: 26,
            ERROR_THRESHOLD: 27,
        }
    },

    ADMIN: {
        EMAIL: 'thedigipane@gmail.com'
    },

    USER: {
        ROLES: {
            ADMIN: 1,
            CEO: 2,
            ACCOUNTANT: 3,
            PROCUREMENT: 4,
            ENGINEER: 5,
            WELDER: 6,
            TESTER: 7,
            CUSTOMER: 8
        }
    }

};
Object.freeze(storeConst); //https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/freeze
// exports.SConst = storeConst;

module.exports = {
    SConst: storeConst
};
