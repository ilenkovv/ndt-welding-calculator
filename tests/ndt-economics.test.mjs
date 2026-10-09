import test from 'node:test';
import assert from 'node:assert/strict';
import {volumeQuote,resourceCost,priceForMargin,compareModels,NDT_METHODS} from '../src/ndt-core/economics.mjs';

test('exact target price for 25% margin (kopecks)',()=>assert.equal(priceForMargin(10_000_000),13_333_334));
test('all six supported NDT methods',()=>assert.deepEqual(NDT_METHODS,['rk','uzk','vik','pvk','mk','thick']));
test('volume price keeps exposures separate from joints',()=>{
 const q=volumeQuote([{method:'rk',unit:'joints',quantity:2,rateKopecks:10000},{method:'rk',unit:'exposures',quantity:8,rateKopecks:30000}]);
 assert.equal(q.totalKopecks,260000);
});
test('resource breakdown and shared mobilization once',()=>{
 const result=compareModels({
  volumeLines:[{method:'vik',unit:'joints',quantity:2,rateKopecks:80000},{method:'uzk',unit:'joints',quantity:2,rateKopecks:90000}],
  resources:{crew:[{quantity:2,rateKopecks:50000}],travel:[{quantity:1,rateKopecks:30000}]},
  sharedCostsKopecks:20000
 });
 assert.equal(result.fullCostKopecks,150000);
 assert.equal(result.quotedPriceKopecks,340000);
 assert.equal(result.belowTarget,false);
});
test('resource categories are accounted exactly once',()=>{
 const r=resourceCost({crew:[{quantity:2,rateKopecks:70000}],equipment:[{quantity:1,rateKopecks:5000}],consumables:[{quantity:4,rateKopecks:2000}],travel:[{quantity:1,rateKopecks:3000}],overheadKopecks:4000});
 assert.equal(r.totalKopecks,160000);
});
test('reject negative volume',()=>assert.throws(()=>volumeQuote([{method:'vik',unit:'joints',quantity:-1,rateKopecks:100}])));
test('reject invalid method',()=>assert.throws(()=>volumeQuote([{method:'gamma',unit:'exposures',quantity:1,rateKopecks:100}])));
test('reject radiometric profile thickness by method whitelist',()=>assert.throws(()=>volumeQuote([{method:'profile',unit:'points',quantity:1,rateKopecks:100}])));
test('ultrasonic thickness is point-based',()=>assert.throws(()=>volumeQuote([{method:'thick',unit:'meters',quantity:1,rateKopecks:100}])));
test('reject margin of 100%',()=>assert.throws(()=>priceForMargin(10000,10000)));
test('reject fractional kopecks',()=>assert.throws(()=>priceForMargin(100.1)));
test('warn when commercial price falls below target',()=>{
 const r=compareModels({volumeLines:[{method:'vik',unit:'joints',quantity:1,rateKopecks:10000}],resources:{crew:[{quantity:1,rateKopecks:10000}]}});
 assert.equal(r.belowTarget,true);
});
