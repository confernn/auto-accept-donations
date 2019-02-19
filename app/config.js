/*
    For more information about all the settings and what they do visit this link: https://github.com/offish/auto-accept-donations/wiki/Configuration


    Tip: If you're unsure of ONE of these settings you could go into your browser and paste the link above and add the setting with a '#' in front of it, as shown below.
    Example: https://github.com/offish/auto-accept-donations/wiki/Configuration#game
    To read about what that SPECIFIC setting does!

*/

module.exports = {
    bot: 
    {
        username:       'username', // The username of your Steam Account 
        password:       'password', // The password of your Steam Account
        shared_secret:  'secret='   // This setting is optional, leave it blank if you don't want automatic logins
    },


    other: 
    {
        clock: 'en',                                // Language code for your 
        persona: 'Online',                          // Steam persona status
        game: [440, 730, 735],
        message: 'Thanks for donating to me!',  
        comment: '+rep donated to me, thanks!'
    },


    group: 
    {
        url: 'https://steamcommunity.com/groups/blankllc',  // URL to your Steam Group
        id: 103582791440562795                              // The ID64 of your group, more info is on the wiki
    },


    enable: 
    {
        messages: true,                         // [true/false]
        comments: true,                         // [true/false]
        blacklist: true,                        // [true/false]
        group_inviting: true                    // [true/false]
    },


    friends: {
        auto_accept: true,                      // Enable or disable automatically accepting friend requests. [true/false]
        minimum_level: 2,                       // Minimum level required to be automatically accepted if setting above is true 
        add_message: 'Thanks for adding me %!'  // Leave the '%' to get it to replace it with the user's name
    }
}
