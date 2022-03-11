/* eslint-disable indent */
const { PAGINATION_MODE, PAGINATION_LIMIT } = require('../config');
const { CREATED_AT, COUNT, VISITS } = PAGINATION_MODE;

const queryFor = (parameter, cursor) => {
  return {
    order: [[parameter, 'DESC']],
    offset: cursor * PAGINATION_LIMIT,
    limit: PAGINATION_LIMIT,
  };
};

const createPaginationQuery = (mode, cursor) => {
  switch (mode) {
    case CREATED_AT:
      return queryFor(CREATED_AT, cursor);
    case COUNT:
      return queryFor(COUNT, cursor);
    case VISITS:
      return queryFor(VISITS, cursor);
  }
};

module.exports = { createPaginationQuery };
