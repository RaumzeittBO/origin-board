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
test('repository persists private receipts, rejects duplicate members and preserves counts when editing', async () => {
  const storage = new Map();
  global.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  Object.defineProperty(global.navigator, 'locks', { configurable: true, value: { request: async (_key, action) => action() } });
  const { LocalWorkspaceRepository } = load('src/repositories/local-workspace-repository.ts');
  const repo = new LocalWorkspaceRepository();
  await repo.saveIdea({ ...idea, category: 'Software' });
  await repo.voteIdea('idea', 'user-dario', 'like');
  await assert.rejects(repo.voteIdea('idea', 'user-dario', 'dislike'));
  await assert.rejects(repo.voteIdea('idea', 'unknown', 'like'));
  await repo.voteIdea('idea', 'user-helmy', 'like');
  await repo.saveIdea({ ...idea, category: 'Apps', title: 'Edited', likes: 0 });
  const saved = (await repo.load()).ideas.find(item => item.id === 'idea');
  assert.equal(saved.likes, 2);
  assert.equal(saved.status, 'APPROVED');
  assert.deepEqual(await new LocalWorkspaceRepository().getIdeaVotes('user-dario'), { idea: 'like' });
  assert.deepEqual(await repo.getIdeaVotes('user-santino'), {});
  assert.equal('votes' in saved, false);
});
