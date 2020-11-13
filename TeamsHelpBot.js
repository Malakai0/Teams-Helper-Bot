const crypto = require('crypto');
const http = require('https');
const { htmlToText } = require('html-to-text');

const sharedSecret = "46JA2dljC+rYiMfz5729FI6gaTxiHrrZ3o6g5BcKYhI=";
const bufSecret = Buffer.from(sharedSecret, "base64");

const prefix = "help-";
const name = "helper";

function extractContent(html) {
    var html_text = `<!DOCTYPE html><p>${String(html).trim()}</p>`
    //return (new jsdom.JSDOM(html_text)).window.document.querySelector("p").textContent;
    return htmlToText(html_text);
}

function mention(who){
    return `<at>${who}</at>`
}

class Command {

    Call(Parsed, RawMessage){
        var args = String(RawMessage).split(" ");
        var caller = Parsed.from.name;
        return this.func(caller, args);
    };

    constructor(name, func){
        this.name = name;
        this.func = func;
    };
}

class Handler {

    ParseMessage(payload){
        var receivedMsg = JSON.parse(payload);
        var raw_content = String(extractContent(String(receivedMsg.text)));
        
        var content = raw_content.substring(name.length).trim();
        var typed_prefix = content.substring(0,prefix.length);

        if (typed_prefix === prefix){
            var after = content.substr(prefix.length, content.length-1);
            var args = (after.split(' '));
            var cmd = this.cmds[String(args[0]).toLowerCase()];

            if (cmd !== undefined){
                args.shift();
                return cmd.Call(receivedMsg, args);
            };

        };

        return false

    };

    AddCommand(cmd){
        this.cmds[String(cmd.name).toLowerCase()] = cmd;
    };
    
    AddCommands(cmds){
        cmds.forEach((command) => {
            this.AddCommand(command);
        })
    }

    constructor(){
        this.cmds = {};
    }

};


let handler = new Handler();

handler.AddCommands([
    (new Command("test", (caller, args) => {
        return `Hello, ${mention(caller)}! You typed: ${args.join(String(" "))}`;
    }))
]);

handler.AddCommand(new Command("hello", (caller, args) => {
    return `Hello, ${mention(caller)}!`;
}));

handler.AddCommand(new Command("goodbye", (caller, args) => {
    return `Goodbye, ${mention(caller)}`;
}));

http.createServer((request, response) => {
    var payload = '';
    request.on('data', function (data) {
        payload += data;
    });

    request.on('end', function() {
        try {

			var auth = this.headers['authorization'];
			var msgBuf = Buffer.from(payload, 'utf8');
			var msgHash = "HMAC " + crypto.createHmac('sha256', bufSecret).update(msgBuf).digest("base64");

            response.writeHead(200);
            if (msgHash === auth) {
                
                var result = handler.ParseMessage(payload);

                if (result !== false){
                    var responseMsg = `{ "type": "message", "text": "${result}" }`;
                }else{
                    var responseMsg = `{ "type": "message", "text": "You didn't type in a valid command!!" }`;	
                }
            } else {
                var responseMsg = `{ "type": "message", "text": "Error: message sender cannot be authenticated." }`;
            }
            response.write(responseMsg);
            response.end();
        }
        catch (err) {
            console.log(err);
            response.writeHead(400);
            response.end("Error: " + err + "\n" + err.stack);
        }
    });
}).listen(8000, ()=>{
    console.log('Listening on port %s', 8000);
});
