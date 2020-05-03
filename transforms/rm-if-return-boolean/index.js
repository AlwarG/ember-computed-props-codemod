const { getParser } = require('codemod-cli').jscodeshift;

module.exports = function transformer(file, api) {
  const j = getParser(api);

  let root = j(file.source);

  //   Case: 1
  // {
  //  if (condition) {
  //    return true;
  //  }
  //  return false;
  // }
  // the above code transforms into
  // {
  //   return condition
  // }

  // Case: 2
  // {
  //  if (condition) {
  //    return false;
  //  }
  //  return true;
  // }
  // the above code transforms into
  // {
  //   return !condition
  // }

  function isBooleanReturnFun(value) {
    if (value) {
      let { body = [] } = value;
      if (body && body.length === 2 && body[1].argument) {
        let arg2Value = body[1].argument.value;
        if (
          body[0].type === 'IfStatement' &&
          body[1].type === 'ReturnStatement' &&
          (arg2Value === false || arg2Value === true)
        ) {
          if (
            !body[0].alternate &&
            body[0].consequent.body &&
            body[0].consequent.body.length === 1 &&
            body[0].consequent.body[0].argument
          ) {
            let arg1Value = body[0].consequent.body[0].argument.value;
            return body[0].consequent.body[0] && (arg1Value === false || arg1Value === true);
          }
          return false;
        }
        return false;
      }
      return false;
    }
    return false;
  }

  root
    .find(j.BlockStatement)
    .filter(({ value }) => isBooleanReturnFun(value))
    .forEach((p) => {
      let arg2Value = p.value.body[1].argument.value;
      let arg1Value = p.value.body[0].consequent.body[0].argument.value;
      p.value.body[1].argument = p.value.body[0].test;
      if (arg1Value === false && arg2Value === true) {
        p.value.body[1].argument = {
          type: 'UnaryExpression',
          operator: '!',
          argument: p.value.body[1].argument,
        };
      }
      p.value.body.shift();
    });

  return root.toSource();
};
