export type ErrorResponse = {
  errors: {
    generalErrors: string[];
  };
  message: string;
  statusCode: number;
};

export type DataErrorResponse = {
  data: ErrorResponse;
};
