/* 
Script developed and maintained by confern
Running an old version of the script? Updates can be found here: https://github.com/confernn/auto-accept-donations
*/

const TradeOfferManager = require('steam-tradeoffer-manager')
const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const moment = require('moment');
const colors = require('colors');

const blacklist = require('./blacklist.json');
const package = require('./../package.json');
const config = require('./config.json');

let info;

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en'
});

moment.locale(config.optional.clock);

const logOnOptions = {
    accountName: config.account.username,
    password: config.account.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.optional.sharedSecret)
};

client.logOn(logOnOptions);

function log(info) {
    return `${package.name} |`.green + moment().format('LTS')+` `+
        ${info == "info" ? info.green : ""}+
        ${info == "trade" ? info.magenta : ""}+
        ${info == "warn" ? info.yellow : ""};
    
    
}

// When user has logged on, log and check if he/she is in the group he/she wants to invite to
client.on('loggedOn', (details, parental) => {
    client.getPersonas([client.steamID], (personas) => {
        info = 'info';
        console.log('\033c');
        console.log(`${log(info)} You're currently running ${package.name} on version ${package.version.green}`);
        console.log(`${log(info)} Logged into Steam as ${personas[client.steamID].player_name.green}`);
        client.setPersona(SteamUser.Steam.EPersonaState.Online);
        if(config.optional.game != 0)
            client.gamesPlayed([config.optional.game]);
        else
            client.gamesPlayed([package.name]);

        setTimeout(verify, 1000);   
    });
});

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
});

// Function that accepts the offer it's given
function accept(offer) {
    offer.accept((err) => {
        if(err) {
            console.log(`${log('warn')} (${offer.id.yellow}) Error while trying to accept donation. ${err.red}`);
        } 
        console.log(`${log('trade')} (${offer.id.yellow}) Trying to accept incoming donation.`);
    })
}

// Function that processes the offer, if the offer is a donation; accept it, else log it in console
function process(offer) {
    if(offer.itemsToGive.length === 0 && offer.itemsToReceive.length > 0) 
        accept(offer);
    
    else 
        console.log(`${log('trade')} (${offer.id.yellow})`+' Incoming offer is not a donation, offer ignored.'.yellow);
}

// If a new offer is received; proccess it 
manager.on('newOffer', (offer) => {
    console.log(`\n${log('trade')} (${offer.id.yellow}) We recieved a new offer. Trade was sent by ${offer.partner.getSteamID64().yellow}`);
    process(offer);
});

// If offer changed it's state; do something
manager.on('receivedOfferChanged', (offer, oldState) => {
    setTimeout(() => {
        if(offer.state === TradeOfferManager.ETradeOfferState.Accepted) {
            console.log(`${log('trade')} (${offer.id.yellow})`+' Incoming offer went through successfully.'.green);
            if(offer.itemsToGive.length === 0) {
                if(config.optional.enableMessages) {
                    client.chatMessage(offer.partner.getSteam3RenderedID(), config.optional.message);
                }
                if(config.optional.enableComments) {
                    
                    if(config.optional.enableBlacklist) {
                        
                        if(blacklist.includes(Number(offer.partner.getSteamID64()))) 
                            console.log(`${log('info')} (${offer.id.yellow})`+' Incoming offer partner is listed in blacklist, not leaving a comment.'.yellow);
                        else {
                            console.log(`${log('info')} (${offer.id.yellow}) Incoming offer partner is not listed blacklist, trying to leave a comment.`);
                            community.postUserComment(offer.partner.getSteam3RenderedID(), config.optional.comment);
                        }

                    } else 
                        community.postUserComment(offer.partner.getSteam3RenderedID(), config.optional.comment);

                }
                if(config.optional.inviteToGroup) {
                    client.addFriend(offer.partner.getSteam3RenderedID()); {
                        if(config.optional.groupID > 0) {
                            community.inviteUserToGroup(offer.partner.getSteam3RenderedID(), config.optional.groupID);
                        }
                    }
                }
                if(!config.optional.enableComments) {
                    console.log(`${log('info')}`+' Comments are disabled, not leaving a comment.'.green);
                }
            }
        }
        if(offer.state === TradeOfferManager.ETradeOfferState.Declined) 
            console.log(`${log(info)} (${offer.id.yellow})`+' You declined your incoming offer.'.red);
        
        if(offer.state === TradeOfferManager.ETradeOfferState.Canceled) 
            console.log(`${log(info)} (${offer.id.yellow})`+' Incoming offer was canceled by sender.'.red);
        
        if(offer.state === TradeOfferManager.ETradeOfferState.Invalid) 
            console.log(`${log(info)} (${offer.id.yellow})`+' Incoming offer is now invalid.'.yellow);
        
        if(offer.state === TradeOfferManager.ETradeOfferState.InvalidItems) 
            console.log(`${log(info)} (${offer.id.yellow})`+' Incoming offer now contains invalid items.'.yellow);
        
        if(offer.state === TradeOfferManager.ETradeOfferState.Expired)
            console.log(`${log(info)} (${offer.id.yellow})`+' Incoming offer expired.'.red);
        
        if(offer.state === TradeOfferManager.ETradeOfferState.InEscrow) 
            console.log(`${log(info)} (${offer.id.yellow})`+' Incoming offer is now in escrow, you will most likely receive your item(s) in some days if no further action is taken.'.green);
        
    }, 1000)
})

// Function that verifies that the user is in the group he/she wants to invite to
function verify() {
    if(config.optional.groupURL) {
        community.getSteamGroup(config.optional.groupURL, (err, group) => {
            if(!err) 
                group.join(); 
        })
    }
}
