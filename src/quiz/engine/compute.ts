/**
 * Motor de expressão aritmética para `variables[*].compute`.
 *
 * Suporta: + - * / ( ), números literais (int/float, notação `.5`),
 * operador unário -, e referência a outras variáveis por identificador.
 *
 * Precedência padrão: `*` e `/` > `+` e `-` > unário `-`.
 *
 * Proibido: chamadas de função, propriedades, strings, acesso ao escopo global.
 * Nunca usamos `eval` nem `new Function` (PRD §8.4).
 *
 * Exemplo:
 *   compute('weight / ((height_cm / 100) * (height_cm / 100))',
 *           { weight: 75, height_cm: 175 })
 *   → 24.489...
 *
 * Retorna `null` se qualquer variável referenciada for `null`/`undefined` ou
 * se a expressão não puder ser avaliada (ex. divisão por zero).
 */

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'ident'; value: string }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i++;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', value: ch });
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let hasDot = false;
      while (j < input.length) {
        const c = input[j];
        if (c >= '0' && c <= '9') {
          j++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          j++;
        } else {
          break;
        }
      }
      const raw = input.slice(i, j);
      const n = Number(raw);
      if (Number.isNaN(n)) {
        throw new Error(`Número inválido: "${raw}"`);
      }
      tokens.push({ kind: 'number', value: n });
      i = j;
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let j = i + 1;
      while (j < input.length) {
        const c = input[j];
        if (
          (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          (c >= '0' && c <= '9') ||
          c === '_'
        ) {
          j++;
        } else {
          break;
        }
      }
      tokens.push({ kind: 'ident', value: input.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`Caractere inválido em expressão: "${ch}"`);
  }
  return tokens;
}

type Scope = Record<string, unknown>;

function readNumeric(scope: Scope, name: string): number | null {
  const v = scope[name];
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

interface Parser {
  tokens: Token[];
  pos: number;
}

function peek(p: Parser): Token | undefined {
  return p.tokens[p.pos];
}
function consume(p: Parser): Token | undefined {
  return p.tokens[p.pos++];
}

function parseExpr(p: Parser, scope: Scope): number | null {
  let left = parseTerm(p, scope);
  if (left === null) return null;
  for (;;) {
    const tk = peek(p);
    if (!tk || tk.kind !== 'op' || (tk.value !== '+' && tk.value !== '-'))
      break;
    consume(p);
    const right = parseTerm(p, scope);
    if (right === null) return null;
    left = tk.value === '+' ? left + right : left - right;
  }
  return left;
}

function parseTerm(p: Parser, scope: Scope): number | null {
  let left = parseFactor(p, scope);
  if (left === null) return null;
  for (;;) {
    const tk = peek(p);
    if (!tk || tk.kind !== 'op' || (tk.value !== '*' && tk.value !== '/'))
      break;
    consume(p);
    const right = parseFactor(p, scope);
    if (right === null) return null;
    if (tk.value === '/' && right === 0) return null;
    left = tk.value === '*' ? left * right : left / right;
  }
  return left;
}

function parseFactor(p: Parser, scope: Scope): number | null {
  const tk = peek(p);
  if (!tk) throw new Error('Fim inesperado da expressão');
  if (tk.kind === 'op' && tk.value === '-') {
    consume(p);
    const inner = parseFactor(p, scope);
    return inner === null ? null : -inner;
  }
  if (tk.kind === 'op' && tk.value === '+') {
    consume(p);
    return parseFactor(p, scope);
  }
  if (tk.kind === 'lparen') {
    consume(p);
    const inner = parseExpr(p, scope);
    const close = consume(p);
    if (!close || close.kind !== 'rparen') {
      throw new Error('Parêntese não fechado');
    }
    return inner;
  }
  if (tk.kind === 'number') {
    consume(p);
    return tk.value;
  }
  if (tk.kind === 'ident') {
    consume(p);
    return readNumeric(scope, tk.value);
  }
  throw new Error(`Token inesperado: ${JSON.stringify(tk)}`);
}

export function evaluateExpression(
  expression: string,
  scope: Scope,
): number | null {
  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) return null;
    const parser: Parser = { tokens, pos: 0 };
    const result = parseExpr(parser, scope);
    if (parser.pos !== tokens.length) {
      throw new Error('Tokens restantes após parsing');
    }
    if (result === null || !Number.isFinite(result)) return null;
    return result;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[compute] falha ao avaliar expressão:', expression, err);
    }
    return null;
  }
}
