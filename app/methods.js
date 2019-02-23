/*
    DO NOT EDIT ANYTHING HERE, UNLESS YOU KNOW WHAT YOU'RE DOING.
*/
const blacklist = require('./blacklist.json');
const package = require('./../package.json');
const config = require('./config');
const colors = require('colors');
const moment = require('moment');

t = module.exports = {
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

    acceptFriends: function() {
        return config.friends.auto_accept == true;
    },

    highEnoughLevel: function(level) {
        return level >= config.friends.minimum_level;
    },

    manageMessage: function(name) {
        var message = config.friends.add_message;
        if(message.indexOf('%') > -1)
            return message.replace('%', name);
        else return message;
    },

    log: function(info) {
        return `${package.name} | `.green + `${moment().format('LTS')} `+
        `${info == "info" ? info.green : ""+info == "trade" ? info.magenta : ""+info == "warn" ? info.yellow : ""}:`
    },

    start: function(name) {
        console.log(`${t.log('info')} Logged into Steam as ${name.green}`);
    },

    games: function() {
        if(config.other.game) {
            config.other.game.unshift(package.name)
            return config.other.game;
        }
        else return package.name
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
                console.log(`${t.log('warn')} ${'New update available for '+package.name+ ' v'+page.version.green+'! You\'re currently only running version '+v.yellow+''}\n${`${t.log('info')} Go to http://github.com/offish/auto-accept-donations to update now!`}`)
            else 
                console.log(`${t.log('info')} You're running the latest version of auto-accept-donations (v${v.green})`)
        }
        request(options, look)
    }
}
