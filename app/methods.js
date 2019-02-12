/**
    DO NOT EDIT ANYTHING HERE, UNLESS YOU KNOW WHAT YOU'RE DOING.
*/
const blacklist = require('./blacklist.json');
const package = require('./../package.json');
const config = require('./config');
const colors = require('colors');

self = module.exports = {
    isDonation: function(offer) {
        return offer.itemsToGive.length === 0 && offer.itemsToReceive.length > 0;
    },

    isBlacklisted: function(id_64) {
        return blacklist.includes(Number(id_64));
    },

    messagesEnabled: function() {
        return config.enable.messages == true;
    },

    commentsEnabled: function() {
        return config.enable.comments == true;
    },

    inviteEnabled: function() {
        return config.enable.group_inviting == true;
    },

    blacklistEnabled: function() {
        return config.enable.blacklist == true;
    },

    getOfferState: function(offer) {
        let state = '';
        offer.state
    }

    log: function(info) {
        return `${package.name} | `.green + `${moment().format('LTS')} `+
        `${info == "info" ? info.green : ""+info == "trade" ? info.magenta : ""+info == "warn" ? info.yellow : ""}:`
    },

    start: function(name) {
        var info = 'info';
        console.log(`\003c`)
        console.log(`${self.log(info)} You're currently running ${package.name} on version ${package.version.green}`)
        console.log(`${log(info)} Logged into Steam as ${name.green}`)
    },

    games: function() {
        let games = [config.other.game]
        if(config.other.game)
            return games.append(package.name);
        else
            return package.name
    },

    check: function() {
        const request = require('request');
        var options = {
            url: 'https://raw.githubusercontent.com/offish/auto-accept-donations/master/package.json',
            method: 'GET',
        };
        function look(error, JSONresponse, body) {
            var page = JSON.parse(body)
            const v = package.version;
            if(page.version != v)
                console.log(`${self.log('warn')} ${'New update available for '+package.name+ ' v'+v+'! You\'re currently only running version '+v+''}\n${`${log('info')} Go to http://github.com/offish/auto-accept-donations to update now!`}`)
            else 
                console.log(`${self.log('info')} You're running the latest version of auto-accept-donations (v${v})`)
        }
        request(options, look)
    }
}
