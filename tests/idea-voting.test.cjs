/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness loads TypeScript without changing application tooling. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(relative) {
  const filename = path.resolve(relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = { exports: {} };
  const resolve = name => name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts') : require(name);
  new Function('require', 'module', 'exports', source)(resolve, result, result.exports);
  return result.exports;
}
const { applyIdeaVote } = load('src/lib/idea-voting.ts');
const idea = { id: 'idea', authorId: 'author', status: 'IDEA' };
test('second like approves and second dislike rejects', () => {
  for (const [vote, status] of [['like', 'APPROVED'], ['dislike', 'REJECTED']]) {
    const first = applyIdeaVote(idea, 'member1', vote, false);
    assert.equal(first.status, 'IDEA');
    assert.equal(applyIdeaVote(first, 'member2', vote, false).status, status);
  }
});
test('mixed votes stay open until a threshold is reached', () => {
  const first = applyIdeaVote(idea, 'a', 'like', false);
  const second = applyIdeaVote(first, 'b', 'dislike', false);
  assert.equal(second.status, 'IDEA');
  assert.equal(applyIdeaVote(second, 'c', 'dislike', false).status, 'REJECTED');
});
test('author, duplicate, invalid and closed votes are rejected', () => {
  assert.throws(() => applyIdeaVote(idea, 'author', 'like', false));
  assert.throws(() => applyIdeaVote(idea, 'a', 'dislike', true));
  assert.throws(() => applyIdeaVote(idea, 'a', 'invalid', false));
  for (const status of ['APPROVED', 'REJECTED', 'CONVERTED_TO_PROJECT']) {
    assert.throws(() => applyIdeaVote({ ...idea, status }, 'a', 'like', false));
  }
});
