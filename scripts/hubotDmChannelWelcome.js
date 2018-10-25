const TxtResp = require('./responses.js')
const {RBU} = require('hubot-doge-utility-functions')
/**
 * Sets up websocket with rocket.chat server and runs "getUserRoles" method.
 *
 * I modified the original version by John Szaszvari <jszaszvari@gmail.com>
 * Git Repo:  https://github.com/jszaszvari/rocketchat-ddp-listener
 *
 */

//authToken that we got from the Rocket.Chat API (requires
//process.env.ROCKETCHAT_PASSWORD, process.env.ROCKETCHAT_USER and process.env.ROCKETCHAT_URL to be set)
module.exports = (robot) => {
  RBU.getAuthToken().then(res => {
    console.log('authToken -> ', res)
    const authToken = res.data.authToken

    const DDP = require("ddp");
    const login = require("ddp-login");
    process.env.METEOR_TOKEN = authToken;

    const ddpClient = new DDP({

      // Address of the Rocket.Chat server you want to connect to
      host: process.env.ROCKETCHAT_WEBSOC_URL,

      // Port of the Rocket.Chat server.
      port: process.env.ROCKETCHAT_WEBSOC_PORT,

      // if server doesn't have ssl remove line below
      ssl: true,
      maintainCollections: true
    });

    ddpClient.connect(function(err) {
      if (err) throw err;


      login(ddpClient, {
        env: "METEOR_TOKEN",
        method: "token",
        retry: 5

      }, async function (error, userInfo) {
          if (error) {
            // Something went wrong...
            console.log(error)

          } else {
            // We are now logged in, with userInfo.token as our session auth token.
            token = userInfo.token;
            console.log("Authentication Sucessful.\n");

            // Subscribe to a message stream from a channel or group
            console.log("Attempting to subscribe to the Group/Channel now.\n");
            const roomId = await RBU.getRoomIdByName(robot, process.env.ROCKETCHAT_WEBSOC_ROOMNAME)

            ddpClient.subscribe("stream-room-messages", [roomId, false], function() {
              console.log(ddpClient.collections);
              console.log("Subscription Complete.\n");


              // Display the stream on console so we can see its working
              console.log("\nStarting live-stream of messages.:\n");
              ddpClient.on("message", function(msg) {
                msg = JSON.parse(msg)
                console.log('incoming', msg)

                if (msg.fields) {

                  // if user is added -> 'au'
                  if (msg.fields.args[0].t === 'au') {

                    // gets the roomId of the DM conversation between the bot and newly added user
                    ddpClient.call('createDirectMessage', [msg.fields.args[0].msg], function(error, resp) {
                      if (error) {
                        console.log('here error ->', error)
                      }

                      ddpClient.call('sendMessage',[{
                        'rid': resp.rid,
                        'msg': TxtResp.bFrankFirstP()}], function (error, resp) {

                        console.log('resp', resp)
                        console.log('error', error)
                        })


                      ddpClient.call('sendMessage',[{
                        'rid': resp.rid,
                        'msg': TxtResp.bFrankReflectQ()}], function (error, resp) {

                        console.log('resp', resp)
                        console.log('error', error)
                        })

                      ddpClient.call('sendMessage',[{
                        'rid': resp.rid,
                        'msg': TxtResp.bFrankMemberQ()}], function (error, resp) {
                        console.log('resp', resp)
                        console.log('error', error)
                      })
                    })
                  }
                }
              })
            })
          }
        }
      )
    })
  })
}
