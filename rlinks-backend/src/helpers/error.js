const createErrorObject = (serverSideMessage, userSideMessage) => {
  const error = new Error(serverSideMessage);
  error.externalMessage = userSideMessage || serverSideMessage;

  return error;
};

module.exports = createErrorObject;
