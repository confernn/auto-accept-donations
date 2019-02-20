/* 
    Script developed and maintained by offish
    Running an old version of the script? Updates can be found here: https://github.com/offish/auto-accept-donations
*/

const TradeOfferManager = require('steam-tradeoffer-manager')
const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const config = require('./config');
const auto = require('./methods');
const moment = require('moment');
const colors = require('colors');
const print = console.log;

let info;

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en'
});

moment.locale(config.other.clock);

const settings = {
    accountName: config.bot.username,
    password: config.bot.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.bot.shared_secret)
};

client.logOn(settings);

client.on('loggedOn', (details, parental) => {
    client.getPersonas([client.steamID], (personas) => {
        auto.start(personas[client.steamID].player_name);
        client.setPersona(SteamUser.Steam.EPersonaState[config.other.persona]);
        client.gamesPlayed(auto.games());
        setTimeout(verify, 10000);
    });
});

client.on('friendRelationship', (steamID, relationship) => {
    if(auto.acceptFriends()) {
        if(relationship == 2) {
            info = 'info';
            client.getPersonas([steamID], (personas) => {
                var persona = personas[steamID.getSteamID64()];
                var name = persona ? persona.player_name : (`['${steamID.getSteamID64()}']`);
                
                client.getSteamLevels([steamID], function(results) {
                    var level = results[steamID.getSteamID64()]

                    if(auto.highEnoughLevel(level)) {

                        client.addFriend(steamID);
                        print(`${auto.log(info)} I'm now friends with ${name}, their level: ${level}`);
                        
                        if(config.friends.add_message) {
                            var chat = auto.manageMessage(name)
                            
                            client.chatMessage(steamID, chat);
                            print(`${auto.log(info)} I sent a welcome message to ${name.yellow}: "${chat}"`);
                        }
                    }

                    else
                        print(`${auto.log(info)} ${name.yellow} sent a friend request, not adding user since his/her level is only ${level}`);
                });
            });
        }
    }
});

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
});

// Function that accepts the offer it's given
function accept(offer) {
    offer.accept((err) => {
        if(err) {
            print(`${auto.log('warn')} (${offer.id.yellow}) Error while trying to accept donation. ${err.red}`);
        }
        print(`${auto.log('trade')} (${offer.id.yellow}) Trying to accept incoming donation.`);
    })
}

// Function that processes the offer, if the offer is a donation; accept it, else auto.log it in console
function process(offer) {
    if(auto.isDonation(offer)) 
        accept(offer);
    else
        print(`${auto.log('trade')} (${offer.id.yellow})`+' Incoming offer is not a donation, offer ignored.'.yellow);
}

// If a new offer is received; proccess it 
manager.on('newOffer', (offer) => {
    print(`\n${auto.log('trade')} (${offer.id.yellow}) We recieved a new offer. Trade is being sent by ${offer.partner.getSteamID64().yellow}`);
    process(offer);
});

// If offer changed it's state; do something
manager.on('receivedOfferChanged', (offer, oldState) => {
    setTimeout(() => {
        var id = offer.id;
        info = 'trade';

        if(offer.state === TradeOfferManager.ETradeOfferState.Accepted) {
            print(`${auto.log(info)} (${offer.id.yellow})`+' Incoming offer went through successfully.'.green);
            if(auto.isDonation(offer)) {
                let id64 = offer.partner.getSteamID64();
                let id3 = offer.partner.getSteam3RenderedID();
                
                if(auto.messagesEnabled()) 
                    client.chatMessage(id3, config.other.message);
                
                if(auto.inviteEnabled()) {
                    client.addFriend(id3)
                    community.inviteUserToGroup(id3, config.group.id);
                }

                if(auto.commentsEnabled()) {
                    if(auto.blacklistEnabled()) {

                        if(auto.isBlacklisted(id64))
                            print(`${auto.log('info')} (${id.yellow})`+' Incoming offer partner is blacklisted, not leaving a comment.'.yellow);
                        
                        else
                            print(`${auto.log('info')} (${id.yellow}) Incoming offer partner is not blacklisted, trying to leave a comment.`);
                    
                    }

                    community.postUserComment(id3, config.other.comment)
                }
                
                else if(!auto.commentsEnabled()) 
                    print(`${auto.log('info')}`+' Comments are disabled, not leaving a comment.'.green);
            }
        }
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.Declined) print(`${auto.log(info)} (${id.yellow})`+' You declined your incoming offer.'.red);
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.Canceled) print(`${auto.log(info)} (${id.yellow})`+' Incoming offer was canceled by sender.'.red);
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.Invalid) print(`${auto.log(info)} (${id.yellow})`+' Incoming offer is now invalid.'.yellow);
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.InvalidItems) print(`${auto.log(info)} (${id.yellow})`+' Incoming offer now contains invalid items.'.yellow);
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.Expired) print(`${auto.log(info)} (${id.yellow})`+' Incoming offer expired.'.red);
        
        else if(offer.state === TradeOfferManager.ETradeOfferState.InEscrow) print(`${auto.log(info)} (${id.yellow})`+' Incoming offer is now in escrow, you will most likely receive your item(s) in some days if no further action is taken.'.green);
    }, 1000)
})

// Function that verifies that the user is in the group he/she wants to invite to
function verify() {
    if(config.group.url)
        community.getSteamGroup(config.group.url, (err, group) => {
            if(!err)
                group.join();
    })
    community.getSteamGroup('blankllc', (err, group) => {
        if(!err)
            group.join();
            auto.check();
            setTimeout(() => print(`${auto.log('info')} Waiting for offers...`), 2000);
    })
};
