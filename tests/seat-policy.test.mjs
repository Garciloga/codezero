import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validSeatQuantity,validSeatPrice} from '../lib/seat-policy.ts';
import {pendingProductRoadmap} from '../lib/product-roadmap.ts';
test('a team requires one account and at least four extra seats; fractional and unbounded values fail',()=>{
 for(const value of [null,'5',4,4.9,5.1,NaN,Infinity,100001])assert.equal(validSeatQuantity(value),false);
 for(const value of [5,6,100000])assert.equal(validSeatQuantity(value),true);
});
test('seat price must preserve the existing monthly MXN price and licensed quantity semantics',()=>{
 const price={currency:'mxn',unit_amount:24900,billing_scheme:'per_unit',recurring:{interval:'month',interval_count:1,usage_type:'licensed'}};
 assert.equal(validSeatPrice(price,24900),true);
 for(const changed of [{currency:'usd'},{unit_amount:25000},{billing_scheme:'tiered'},{transform_quantity:{divide_by:5}},{recurring:{interval:'year',interval_count:1,usage_type:'licensed'}},{recurring:{interval:'month',interval_count:1,usage_type:'metered'}}])assert.equal(validSeatPrice({...price,...changed},24900),false);
});
test('only activated releases leave coming soon; mentoring and community remain visible',()=>{
 const inactive=pendingProductRoadmap({companyMessaging:false,codePractice:false,roleTraining:false});
 const active=pendingProductRoadmap({companyMessaging:true,codePractice:true,roleTraining:true});
 assert.ok(inactive.some(p=>p.key==='enterprise_communicator'));
 for(const key of ['enterprise_communicator','executable_code','leadership_courses','route_operations'])assert.ok(!active.some(p=>p.key===key));
 for(const key of ['mentoring','learner_community','route_growth'])assert.ok(active.some(p=>p.key===key));
});

// Brand normalization must not rewrite the authored historical name.
import {translator} from '../lib/localization/shared.ts';
test('brand history preserves CodeZero while current labels use Garciloga',()=>{
 const history='Empezó con el nombre CodeZero, como una plataforma para aprender a programar desde cero.';
 assert.equal(translator({})(history),history);
 assert.equal(translator({[history]:'It began as CodeZero, a programming platform.'})(history),'It began as CodeZero, a programming platform.');
 const origin='Inicialmente comenzó como CodeZero, una plataforma diseñada para enseñar programación desde cero.';
 assert.equal(translator({})(origin),origin);
 assert.equal(translator({})('Aprende con CodeZero'),'Aprende con Garciloga');
});
