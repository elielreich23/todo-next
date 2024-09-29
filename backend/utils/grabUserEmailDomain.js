function grabEmailDomain(user){
    // get user email domain from string
    const emailDomain = user.email.split('@')[1]
    switch (emailDomain){
        case 'gmail.com':
            return {
                link : "https://mail.google.com",
                userType : "Individual"
            };
        case 'outlook.com' || 'hotmail.com' || 'live.com':
            return {
                link : "https://outlook.live.com/",
                userType : "Individual"
            };
        case 'yahoo.com':
            return  {
                link :'https://mail.yahoo.com/',
                userType : "Individual"
            };
        case 'icloud.com':
            return {
                link : 'https://www.icloud.com/mail',
                userType : "Individual"
            };
        case 'aol.com':
            return {
                link : 'https://mail.aol.com/',
                userType : "Individual"
            };
        default:
            return {
                link : 'https://www.google.com/search?q=login+to+email',
                userType : "Company"
            }; 

    }
}

module.exports.grabEmailDomain = grabEmailDomain