import { ValidationError } from "class-validator";
import { ErrorCode } from "../errors/error-codes";
import {
  flattenValidationErrors,
  validationExceptionFactory,
} from "./validation-exception.factory";

describe("validation-exception.factory", () => {
  it("flattens nested validation errors with dotted paths", () => {
    const errors = [
      Object.assign(new ValidationError(), {
        property: "name",
        constraints: { isString: "name must be a string" },
      }),
      Object.assign(new ValidationError(), {
        property: "address",
        children: [
          Object.assign(new ValidationError(), {
            property: "city",
            constraints: { isString: "city must be a string" },
          }),
        ],
      }),
    ];

    expect(flattenValidationErrors(errors)).toEqual({
      name: ["name must be a string"],
      "address.city": ["city must be a string"],
    });
  });

  it("builds a 400 exception with code and fieldErrors", () => {
    const error = validationExceptionFactory([
      Object.assign(new ValidationError(), {
        property: "email",
        constraints: { isEmail: "email must be an email" },
      }),
    ]);

    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      fieldErrors: { email: ["email must be an email"] },
    });
  });
});
