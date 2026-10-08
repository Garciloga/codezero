// Synthetic unsafe fixtures. These are never imported or executed by the app.
// ruleid: codezero-no-eval
eval(userInput);
// ruleid: codezero-no-eval
new Function(userInput);
// ruleid: codezero-no-shell-execution
exec(userInput);
// ruleid: codezero-no-shell-execution
spawn('cmd', [], {shell: true});
// ruleid: codezero-no-raw-html
const element = <div dangerouslySetInnerHTML={{__html: userInput}} />;
// ruleid: codezero-no-raw-html
node.innerHTML = userInput;
// ruleid: codezero-tls-validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// ruleid: codezero-tls-validation
const options = {rejectUnauthorized: false};
// ruleid: codezero-no-public-server-secret
const credential = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;
// ruleid: codezero-no-unverified-jwt
const jwtOptions = {algorithms: ["none"]};
// ok: codezero-no-public-server-secret
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// ok: codezero-no-shell-execution
execFile('command', ['argument']);
// ok: codezero-tls-validation
const secureOptions = {rejectUnauthorized: true};
