// export const xyzWebsocket = io(envConfig.websocket.friends, {
// 	autoConnect: false,
// 	auth: {
// 		token: localStorage.getItem('accessToken')
// 	}
// });

export enum WSMessage {
	send_friend_invitation = 'send_friend_invitation',
	accept_friend_invitation = 'accept_friend_invitation',
	remove_friend = 'remove_friend',
	block_user = 'block_user',
	unblock_user = 'unblock_user',
	friend_presence_update = 'friend_presence_update'
}
