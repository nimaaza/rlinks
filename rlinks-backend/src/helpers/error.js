const createErrorObject = (serverSideMessage, userSideMessage) => {
  const error = new Error(serverSideMessage);
  error.externalMessage = userSideMessage || serverSideMessage;

  return error;
};

const externalAuthorizationErrorMessage = 'Unauthorized access.';

module.exports = {
  externalAuthorizationErrorMessage,
  createErrorObject,
};
