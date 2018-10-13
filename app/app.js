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
const print = console.log;

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
    return `${package.name} | `.green + `${moment().format('LTS')} `+
    `${info == "info" ? info.green : ""+info == "trade" ? info.magenta : ""+info == "warn" ? info.yellow : ""}:`
}

// When user has logged on, log and check if he/she is in the group he/she wants to invite to
client.on('loggedOn', (details, parental) => {
    client.getPersonas([client.steamID], (personas) => {
        info = 'info';
        print('\033c');
        print(`${log(info)} You're currently running ${package.name} on version ${package.version.green}`);
        print(`${log(info)} Logged into Steam as ${personas[client.steamID].player_name.green}`);
        client.setPersona(SteamUser.Steam.EPersonaState.Online);
        if(config.optional.game)
            client.gamesPlayed([package.name, config.optional.game]);
        else
            client.gamesPlayed(package.name);
        setTimeout(verify, 1000);  
    });
});

// Auto-accept friend requests
client.on('friendRelationship', (steamID, relationship) => {
    if(relationship == 2) {
        info = 'info';
        client.getPersonas([steamID], (personas) => {
            const path = config.optional.friends;
            var persona = personas[steamID.getSteamID64()];
            let name = persona ? persona.player_name : (`['${steamID.getSteamID64()}']`);
            if(path.autoAccept) {
                client.getSteamLevels([steamID], function(results) {
                    if(path.requiredLevel > results[steamID.getSteamID64()]) 
                        print(`${log(info)} ${name.yellow} sent a friend request, not adding user since his/her level is only ${results[steamID.getSteamID64()]}`);
                    else 
                        client.addFriend(steamID);
                        print(`${log(info)} I'm now friends with ${name}, their level: ${results[steamID.getSteamID64()]}`);
                        if(path.welcomeMessage)
                            if(path.welcomeMessage.indexOf('%name%') > -1) {
                                client.chatMessage(steamID, path.welcomeMessage.replace('%name%', name));
                                print(`${log(info)} I sent a welcome message to ${name.yellow}: ${path.welcomeMessage.replace('%name%', name)}`);
                            }
                            else                            
                                client.chatMessage(steamID, path.welcomeMessage);
                                print(`${log(info)} I sent a welcome message to ${name.yellow}: ${path.welcomeMessage}`);
                });
            }
        });
    }
});

client.on('webSession', (session, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
});

// Function that accepts the offer it's given
function accept(offer) {
    offer.accept((err) => {
        if(err) {
            print(`${log('warn')} (${offer.id.yellow}) Error while trying to accept donation. ${err.red}`);
        }
        print(`${log('trade')} (${offer.id.yellow}) Trying to accept incoming donation.`);
    })
}

// Function that processes the offer, if the offer is a donation; accept it, else log it in console
function process(offer) {
    if(offer.itemsToGive.length === 0 && offer.itemsToReceive.length > 0) 
        accept(offer);
    else
        print(`${log('trade')} (${offer.id.yellow})`+' Incoming offer is not a donation, offer ignored.'.yellow);
}

// If a new offer is received; proccess it 
manager.on('newOffer', (offer) => {
    print(`\n${log('trade')} (${offer.id.yellow}) We recieved a new offer. Trade is being sent by ${offer.partner.getSteamID64().yellow}`);
    process(offer);
});

// If offer changed it's state; do something
manager.on('receivedOfferChanged', (offer, oldState) => {
    setTimeout(() => {
        if(offer.state === TradeOfferManager.ETradeOfferState.Accepted) {
            print(`${log('trade')} (${offer.id.yellow})`+' Incoming offer went through successfully.'.green);
            if(offer.itemsToGive.length === 0) {
                if(config.optional.enableMessages) {
                    client.chatMessage(offer.partner.getSteam3RenderedID(), config.optional.message);
                }
                if(config.optional.enableComments) {
                    if(config.optional.enableBlacklist) {
                        if(blacklist.includes(Number(offer.partner.getSteamID64()))) 
                            print(`${log('info')} (${offer.id.yellow})`+' Incoming offer partner is listed in blacklist, not leaving a comment.'.yellow);
                        else {
                            print(`${log('info')} (${offer.id.yellow}) Incoming offer partner is not listed blacklist, trying to leave a comment.`);
                            community.postUserComment(offer.partner.getSteam3RenderedID(), config.optional.comment);
                        }
                    } 
                    else 
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
                    print(`${log('info')}`+' Comments are disabled, not leaving a comment.'.green);
                }
            }
        }
        info = 'trade';
        if(offer.state === TradeOfferManager.ETradeOfferState.Declined) print(`${log(info)} (${offer.id.yellow})`+' You declined your incoming offer.'.red);
        if(offer.state === TradeOfferManager.ETradeOfferState.Canceled) print(`${log(info)} (${offer.id.yellow})`+' Incoming offer was canceled by sender.'.red);
        if(offer.state === TradeOfferManager.ETradeOfferState.Invalid) print(`${log(info)} (${offer.id.yellow})`+' Incoming offer is now invalid.'.yellow);
        if(offer.state === TradeOfferManager.ETradeOfferState.InvalidItems) print(`${log(info)} (${offer.id.yellow})`+' Incoming offer now contains invalid items.'.yellow);
        if(offer.state === TradeOfferManager.ETradeOfferState.Expired) print(`${log(info)} (${offer.id.yellow})`+' Incoming offer expired.'.red);
        if(offer.state === TradeOfferManager.ETradeOfferState.InEscrow) print(`${log(info)} (${offer.id.yellow})`+' Incoming offer is now in escrow, you will most likely receive your item(s) in some days if no further action is taken.'.green);
    }, 1000)
})

// Function that verifies that the user is in the group he/she wants to invite to
function verify() {
    if(config.optional.groupURL)
        community.getSteamGroup(config.optional.groupURL, (err, group) => {
            if(!err) 
                group.join();
    })
}
