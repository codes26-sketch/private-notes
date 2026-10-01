import { describe,it,expect } from 'vitest';
import { splitChunks,scoreChunk,tokenize } from '../server/text';

describe('local note retrieval utilities',()=>{
 it('finds short one-word queries and common numbered abbreviations',()=>{
  expect(scoreChunk('2nf','Second Normal Form (2NF) requires atomic attributes.')).toBeGreaterThan(0);
  expect(scoreChunk('stack','A stack is a last in first out data structure.')).toBeGreaterThan(0);
 });
 it('normalizes accents and tokenizes short terms',()=>expect(tokenize('Résumé SQL 2NF')).toEqual(['resume','sql','2nf']));
 it('preserves code punctuation, casing and indentation across chunks',()=>{
  const code='int main() {\n    std::cout << "Hello, World!";\n    return 0;\n}';
  expect(splitChunks(code,1000,10)).toEqual([code]);
 });
 it('splits long content while retaining overlap',()=>{
  const parts=splitChunks('alpha beta gamma delta epsilon zeta eta theta',25,8);
  expect(parts.length).toBeGreaterThan(1);
  expect(parts[0].slice(-8)).toBe(parts[1].slice(0,8));
 });
});
