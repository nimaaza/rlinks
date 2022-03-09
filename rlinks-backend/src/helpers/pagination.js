/* eslint-disable indent */
const { PAGINATION_MODE, PAGINATION_LIMIT } = require('../config');

const queryFor = (parameter, cursor) => {
  return {
    order: [[parameter, 'DESC']],
    offset: cursor * PAGINATION_LIMIT,
    limit: PAGINATION_LIMIT,
  };
};

const createPaginationQuery = (mode, cursor) => {
  switch (mode) {
    case PAGINATION_MODE.CREATED_AT:
      return queryFor('id', cursor);
    case PAGINATION_MODE.COUNT:
      return queryFor('count', cursor);
    case PAGINATION_MODE.VISITS:
      return queryFor('visits', cursor);
  }
};

module.exports = { createPaginationQuery };
