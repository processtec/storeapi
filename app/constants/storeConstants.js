/*jslint node: true */
'use strict';

const storeConst = {
    
    PRODUCT: {
        STATUS: {
            ORDERED: 0, // ordered but not received.
            AVAILABLE: 1, // received and inspected.
            SOLD: 2, // existing
            DAMAGED: 3, // existing
            TEST_EQUIPMENT: 4,// existing
            MAINTENANCE: 5,// existing
            TRIALS: 6,// existing
            UNKNOWN: 7// existing
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
        NOT_ACTIVE: 0,
        AVAILABLE: 1,
        COMPLETED: 2,
        DELETED: 3,
        UNKNOWN: 4
      }
    },

    ES: {
        INDEX_COMPONENTS: "complete_comps_08_15_2020"
    },

    ALERT: {
        TIMEOUT: 2000,
        
        TYPE: {
            CHECKOUT_SUCCESS: 1,
            
            PRODUCT_AVAILABLE: 5,
            PRODUCT_DAMAGED: 6,
            PRODUCT_MAINTENANCE: 7,
            PRODUCT_TESTING: 8,
            PRODUCT_TRIALS: 9,

            USER_CREATED: 11,
            USER_PASSWORD: 12,
            USER_ROLE: 13,

            ERROR_ANY: 25,
            ERROR_THRESHOLD: 26,
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
