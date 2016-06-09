import {GraphQLScalarType} from 'graphql';
import {GraphQLError} from 'graphql/error';
import {Kind} from 'graphql/language';


// https://github.com/graphql/graphql-js/blob/master/src/type/scalars.js
const MAX_INT = 2147483647;
const MIN_INT = -2147483648;

function isSafeInteger(num) {
  return typeof num === 'number' &&
    isFinite(num) &&
    Math.floor(num) === num &&
    num <= MAX_INT &&
    num >= MIN_INT;
}

function coerceInt(value) {
  const num = Number(value);
  if (isSafeInteger(num)) {
    return (num < 0 ? Math.ceil : Math.floor)(num);
  }
  return null;
}

export default ({
  typeName,
  argName,
  transform,
  min,
  max,
  test,
}) => {
  if (!typeName) {
    throw new Error('"typeName" is required');
  }

  if (!argName) {
    throw new Error('"argName" is required');
  }

  const error = (value, ast, message) => {
    throw new GraphQLError(`Argument "${argName}" has invalid value ${JSON.stringify(value)}.${message ? ` ${message}` : ''}.`, ast ? [ast] : []);
  };

  const parseValue = (value, ast) => {
    value = coerceInt(value);
    if (value == null) {
      return null;
    }

    if (transform) {
      value = transform(value);
      if (!isSafeInteger(value)) {
        return null;
      }
    }

    if (min != null && value < min) {
      error(value, ast, `Expected minimum "${min}"`);
    }

    if (max != null && value > max) {
      error(value, ast, `Expected maximum "${max}"`);
    }

    if (test && !test(value)) {
      return null;
    }

    return value;
  };

  return new GraphQLScalarType({
    name: typeName,
    serialize: coerceInt,
    parseValue,
    parseLiteral(ast) {
      const {kind, value} = ast;
      if (kind === Kind.INT) {
        return parseValue(value, ast);
      }
      return null;
    },
  });
};
