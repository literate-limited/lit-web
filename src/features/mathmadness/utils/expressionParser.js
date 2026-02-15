const DEFAULT_CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const log10 = Math.log10 ?? ((value) => Math.log(value) / Math.LN10);
const log2 = Math.log2 ?? ((value) => Math.log(value) / Math.LN2);
const cbrt = Math.cbrt ?? ((value) => Math.pow(value, 1 / 3));

const DEFAULT_FUNCTION_DEFS = {
  sin: { fn: Math.sin, minArgs: 1, maxArgs: 1 },
  cos: { fn: Math.cos, minArgs: 1, maxArgs: 1 },
  tan: { fn: Math.tan, minArgs: 1, maxArgs: 1 },
  asin: { fn: Math.asin, minArgs: 1, maxArgs: 1 },
  acos: { fn: Math.acos, minArgs: 1, maxArgs: 1 },
  atan: { fn: Math.atan, minArgs: 1, maxArgs: 1 },
  atan2: { fn: Math.atan2, minArgs: 2, maxArgs: 2 },
  sinh: { fn: Math.sinh, minArgs: 1, maxArgs: 1 },
  cosh: { fn: Math.cosh, minArgs: 1, maxArgs: 1 },
  tanh: { fn: Math.tanh, minArgs: 1, maxArgs: 1 },
  log: {
    fn: (value, base) =>
      base == null ? Math.log(value) : Math.log(value) / Math.log(base),
    minArgs: 1,
    maxArgs: 2,
  },
  ln: { fn: Math.log, minArgs: 1, maxArgs: 1 },
  log10: { fn: log10, minArgs: 1, maxArgs: 1 },
  log2: { fn: log2, minArgs: 1, maxArgs: 1 },
  sqrt: { fn: Math.sqrt, minArgs: 1, maxArgs: 1 },
  cbrt: { fn: cbrt, minArgs: 1, maxArgs: 1 },
  abs: { fn: Math.abs, minArgs: 1, maxArgs: 1 },
  exp: { fn: Math.exp, minArgs: 1, maxArgs: 1 },
  pow: { fn: Math.pow, minArgs: 2, maxArgs: 2 },
  floor: { fn: Math.floor, minArgs: 1, maxArgs: 1 },
  ceil: { fn: Math.ceil, minArgs: 1, maxArgs: 1 },
  round: { fn: Math.round, minArgs: 1, maxArgs: 1 },
  sign: { fn: Math.sign, minArgs: 1, maxArgs: 1 },
  min: { fn: Math.min, minArgs: 1, maxArgs: Infinity },
  max: { fn: Math.max, minArgs: 1, maxArgs: Infinity },
  hypot: { fn: Math.hypot, minArgs: 1, maxArgs: Infinity },
  clamp: {
    fn: (value, min, max) => Math.min(max, Math.max(min, value)),
    minArgs: 3,
    maxArgs: 3,
  },
  mod: { fn: (left, right) => left % right, minArgs: 2, maxArgs: 2 },
};

const formatError = (err, fallback) => {
  const message = err?.message || fallback;
  return message.split("\n")[0].slice(0, 90);
};

const normalizeExpression = (input) => {
  let expr = (input ?? "").trim();
  if (!expr) return "";

  const eqIndex = expr.indexOf("=");
  if (eqIndex !== -1) {
    expr = expr.slice(eqIndex + 1);
  }

  return expr.trim();
};

const tokenizeExpression = (input) => {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      const start = i;
      let hasDot = false;

      if (ch === ".") {
        if (i + 1 >= input.length || !/\d/.test(input[i + 1])) {
          throw new Error('Unexpected token "."');
        }
        hasDot = true;
        i += 1;
      }

      while (i < input.length && /\d/.test(input[i])) i += 1;

      if (i < input.length && input[i] === ".") {
        if (hasDot) {
          throw new Error('Unexpected token "."');
        }
        hasDot = true;
        i += 1;
        while (i < input.length && /\d/.test(input[i])) i += 1;
      }

      if (i < input.length && /[eE]/.test(input[i])) {
        let next = i + 1;
        if (/[+-]/.test(input[next])) next += 1;
        if (next >= input.length || !/\d/.test(input[next])) {
          throw new Error('Unexpected token "e"');
        }
        i = next + 1;
        while (i < input.length && /\d/.test(input[i])) i += 1;
      }

      tokens.push({ type: "number", value: Number(input.slice(start, i)) });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) i += 1;
      tokens.push({ type: "ident", value: input.slice(start, i) });
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "open_paren", value: ch });
      i += 1;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "close_paren", value: ch });
      i += 1;
      continue;
    }

    if (ch === ",") {
      tokens.push({ type: "comma", value: ch });
      i += 1;
      continue;
    }

    if (ch === "|") {
      tokens.push({ type: "pipe", value: ch });
      i += 1;
      continue;
    }

    if (ch === "*" && input[i + 1] === "*") {
      tokens.push({ type: "op", value: "^" });
      i += 2;
      continue;
    }

    if ("+-*/^%".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected token "${ch}"`);
  }

  return tokens;
};

const isValueToken = (token) =>
  token &&
  ["number", "variable", "constant", "close_paren", "abs_close"].includes(
    token.type
  );

const tokenLabel = (token) => {
  if (!token) return "end of input";
  if (token.type === "number") return String(token.value);
  if (token.type === "variable") return token.value;
  if (token.type === "constant") return token.value;
  if (token.type === "function") return token.value;
  if (token.type === "abs_open" || token.type === "abs_close") return "|";
  if (token.type === "open_paren") return "(";
  if (token.type === "close_paren") return ")";
  if (token.type === "comma") return ",";
  if (token.type === "op") return token.value;
  return token.type;
};

const formatArgRange = (minArgs, maxArgs) => {
  if (maxArgs === Infinity) return `at least ${minArgs}`;
  if (minArgs === maxArgs) return `${minArgs}`;
  return `${minArgs}-${maxArgs}`;
};

const classifyTokens = (tokens, variables, functions, constants) => {
  const result = [];
  let prev = null;
  const variableSet = new Set((variables || []).map((v) => v.toLowerCase()));

  for (const token of tokens) {
    if (token.type === "pipe") {
      const type = !prev || !isValueToken(prev) ? "abs_open" : "abs_close";
      result.push({ type, value: "|" });
    } else if (token.type === "ident") {
      const name = token.value.toLowerCase();
      if (functions[name]) {
        result.push({ type: "function", value: name });
      } else if (Object.prototype.hasOwnProperty.call(constants, name)) {
        result.push({ type: "constant", value: name });
      } else if (variableSet.has(name)) {
        result.push({ type: "variable", value: name });
      } else {
        throw new Error(`Unknown identifier "${token.value}"`);
      }
    } else {
      result.push(token);
    }
    prev = result[result.length - 1];
  }

  return result;
};

const insertImplicitMultiplication = (tokens) => {
  const output = [];
  const canStart = (token) =>
    token &&
    ["number", "variable", "constant", "function", "open_paren", "abs_open"].includes(
      token.type
    );

  for (const token of tokens) {
    const prev = output[output.length - 1];
    if (isValueToken(prev) && canStart(token)) {
      output.push({ type: "op", value: "*" });
    }
    output.push(token);
  }

  return output;
};

const validateArgCount = (name, count, functions) => {
  const { minArgs, maxArgs } = functions[name];
  if (count < minArgs || count > maxArgs) {
    throw new Error(`${name} expects ${formatArgRange(minArgs, maxArgs)} args`);
  }
};

const parseTokens = (tokens, functions, constants) => {
  let index = 0;

  const peek = () => tokens[index];
  const consume = () => tokens[index++];
  const match = (type, value) => {
    const token = peek();
    if (!token) return false;
    if (token.type !== type) return false;
    if (value != null && token.value !== value) return false;
    index += 1;
    return true;
  };

  const expect = (type, value) => {
    const token = peek();
    if (!token || token.type !== type || (value != null && token.value !== value)) {
      throw new Error(`Expected "${value ?? type}", got "${tokenLabel(token)}"`);
    }
    return consume();
  };

  const tokenStartsFactor = (token) =>
    token &&
    ["number", "variable", "constant", "function", "open_paren", "abs_open"].includes(
      token.type
    );

  const parseExpression = () => parseAddSub();

  const parseAddSub = () => {
    let node = parseMulDiv();
    while (true) {
      const token = peek();
      if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
        consume();
        const right = parseMulDiv();
        node = { type: "binary", op: token.value, left: node, right };
      } else {
        break;
      }
    }
    return node;
  };

  const parseMulDiv = () => {
    let node = parseUnary();
    while (true) {
      const token = peek();
      if (token?.type === "op" && ["*", "/", "%"].includes(token.value)) {
        consume();
        const right = parseUnary();
        node = { type: "binary", op: token.value, left: node, right };
      } else if (tokenStartsFactor(token)) {
        const right = parseUnary();
        node = { type: "binary", op: "*", left: node, right };
      } else {
        break;
      }
    }
    return node;
  };

  const parseUnary = () => {
    const token = peek();
    if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
      consume();
      return { type: "unary", op: token.value, expr: parseUnary() };
    }
    return parsePower();
  };

  const parsePower = () => {
    let node = parsePrimary();
    const token = peek();
    if (token?.type === "op" && token.value === "^") {
      consume();
      const right = parseUnary();
      node = { type: "binary", op: "^", left: node, right };
    }
    return node;
  };

  const parseFunctionCall = () => {
    const fnToken = expect("function");
    const args = [];
    if (match("open_paren")) {
      if (match("close_paren")) {
        throw new Error(`${fnToken.value} expects ${formatArgRange(
          functions[fnToken.value].minArgs,
          functions[fnToken.value].maxArgs
        )} args`);
      }
      args.push(parseExpression());
      while (match("comma")) {
        args.push(parseExpression());
      }
      expect("close_paren");
    } else {
      args.push(parseMulDiv());
    }
    validateArgCount(fnToken.value, args.length, functions);
    return { type: "call", name: fnToken.value, args };
  };

  const parsePrimary = () => {
    const token = peek();
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    if (token.type === "number") {
      consume();
      return { type: "number", value: token.value };
    }
    if (token.type === "variable") {
      consume();
      return { type: "variable", name: token.value };
    }
    if (token.type === "constant") {
      consume();
      return { type: "number", value: constants[token.value] };
    }
    if (token.type === "function") {
      return parseFunctionCall();
    }
    if (token.type === "open_paren") {
      consume();
      const node = parseExpression();
      expect("close_paren");
      return node;
    }
    if (token.type === "abs_open") {
      consume();
      const node = parseExpression();
      expect("abs_close");
      return { type: "call", name: "abs", args: [node] };
    }
    throw new Error(`Unexpected token "${tokenLabel(token)}"`);
  };

  const ast = parseExpression();
  if (index < tokens.length) {
    throw new Error(`Unexpected token "${tokenLabel(tokens[index])}"`);
  }
  return ast;
};

const evaluateAst = (node, scope, functions) => {
  switch (node.type) {
    case "number":
      return node.value;
    case "variable": {
      if (!Object.prototype.hasOwnProperty.call(scope, node.name)) {
        throw new Error(`Variable "${node.name}" is not defined`);
      }
      return scope[node.name];
    }
    case "unary": {
      const value = evaluateAst(node.expr, scope, functions);
      return node.op === "-" ? -value : value;
    }
    case "binary": {
      const left = evaluateAst(node.left, scope, functions);
      const right = evaluateAst(node.right, scope, functions);
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "%":
          return left % right;
        case "^":
          return Math.pow(left, right);
        default:
          throw new Error(`Unknown operator "${node.op}"`);
      }
    }
    case "call": {
      const def = functions[node.name];
      const args = node.args.map((arg) => evaluateAst(arg, scope, functions));
      return def.fn(...args);
    }
    default:
      throw new Error(`Unknown node "${node.type}"`);
  }
};

export const compileExpression = (
  expression,
  {
    variables = ["x"],
    functions = DEFAULT_FUNCTION_DEFS,
    constants = DEFAULT_CONSTANTS,
  } = {}
) => {
  const trimmed = (expression ?? "").trim();
  if (!trimmed) {
    return { evaluator: null, error: "Enter expression" };
  }

  let normalized;
  try {
    normalized = normalizeExpression(trimmed);
  } catch (err) {
    return { evaluator: null, error: formatError(err, "Fix expression") };
  }

  if (!normalized) {
    return { evaluator: null, error: "Enter expression" };
  }

  try {
    const tokens = insertImplicitMultiplication(
      classifyTokens(tokenizeExpression(normalized), variables, functions, constants)
    );
    const ast = parseTokens(tokens, functions, constants);
    const evaluator = (scope) => evaluateAst(ast, scope, functions);
    return { evaluator, error: null, ast, normalized };
  } catch (err) {
    return { evaluator: null, error: formatError(err, "Fix expression") };
  }
};

export const FUNCTION_DEFS = DEFAULT_FUNCTION_DEFS;
export const CONSTANTS = DEFAULT_CONSTANTS;
