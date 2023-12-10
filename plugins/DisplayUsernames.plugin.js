/**
 * @name DisplayUsernames
 * @author HG
 * @authorId 124667638298181632
 * @authorLink https://youtube.com/HudsonGTV
 * @description Displays Discord handle next to display names in chat and adds '@' symbol in profile cards.
 * @version 1.3.1
 * @website https://hudsongreen.com/
 * @invite H3bebA97tV
 * @donate https://www.paypal.com/donate/?business=REFHYLZAZUWHJ
 * @source https://github.com/HudsonGTV/BetterDiscordPlugins/blob/main/DisplayUsernames/DisplayUsernames.plugin.js
 */
 
const request = require("request");
const fs = require("fs");
const path = require("path");

const config = {
	info: {
		name: "DisplayUsernames",
		authors: [
			{	
				name: "HG",
				discord_id: "124667638298181632",
				github_username: "HudsonGTV",
				twitter_username: "HudsonKazuto"
			}
		],
		version: "1.3.1",
		description: "Displays Discord handle next to display names in chat and adds '`@`' symbol in profile cards.",
		github: "https://github.com/HudsonGTV/BetterDiscordPlugins/blob/main/DisplayUsernames/DisplayUsernames.plugin.js",
		github_raw: "https://raw.githubusercontent.com/HudsonGTV/BetterDiscordPlugins/main/DisplayUsernames/DisplayUsernames.plugin.js"
	},
	changelog: [
		{
			title: "Fixes",
			type: "fixed",
			items: [
				"`[1.3.1]` Fixed display issues caused by recent Discord revamp.",
				"`[1.3.1]` Fixed issue with handle prefix showing in front of profile nickname in setting window."
			]
		}
		/*{
			title: "Additions",
			type: "added",
			items: [
				"`[1.x.x]` foobar."
			]
		},*/
		/*{
			title: "Improvements",
			type: "improved",
			items: [
				"`[1.2.0]` Settings now apply without the need to restart Discord (Except handle symbol changes)."
			]
		}*/
	],
	defaultConfig: [
		{
			type: "textbox",
			id: "handlesymbol",
			name: "[Needs restart to fully apply] Username Handle Prefix Symbol",
			note: "The symbol used as a prefix for usernames (the @ in @username).",
			placeholder: "Blank for none; default: @",
			value: "@"
		},
		{
			type: "switch",
			id: "usernamechat",
			name: "Show Username In Chat",
			note: "Display the message author's username next to the message timestamp.",
			value: true
		},
		{
			type: "switch",
			id: "profilecard",
			name: "Show Handle Prefix In Profile Card & Friends List",
			note: "Display the username handle prefix in profile cards/popups as well as the friends list.",
			value: true
		},
		{
			type: "switch",
			id: "friendslist",
			name: "Always Show Friends List Username",
			note: "Force Discord to always display usernames next to display names in friends list. Turn off for default Discord behavior (only show on hover).",
			value: true
		}
	]
};

module.exports = !global.ZeresPluginLibrary ? class {
	
	constructor() {
		this._config = config;
	}
	
	load() {
		BdApi.showConfirmationModal("Library plugin is needed",
			`The library plugin needed for ZeresPluginLibrary is missing. Please click Download Now to install it.`, {
			confirmText: "Download",
			cancelText: "Cancel",
			onConfirm: () => {
				request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
					if (error)
						return electron.shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");

					fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
				});
			}
		});
	}
	
	start() { }
	stop() { }
	
} : (([Plugin, Library]) => {
	
	const { DiscordModules, WebpackModules, Patcher, PluginUtilities } = Library;
	const { React } = DiscordModules;
	
	class plugin extends Plugin {
		
		constructor() {
			super();
		}


		onStart() {
			
			// Apply CSS Styles
			this.applyStyles();
			
			// Bind usernames if enabled
			if(this.settings.usernamechat) this.applyUsername();
			
		}

		onStop() {
			Patcher.unpatchAll();
			this.removeStyles();
		}
		
		// Manage settings panel
		getSettingsPanel() {
			
			const panel = this.buildSettingsPanel();
			
			// Listen for changes in settings
			panel.addListener((id, val) => {
				switch(id) {
				case "usernamechat":
					// Check bool val
					if(val)
						this.applyUsername();
					else
						Patcher.unpatchAll();	// Change this if I add more patches to plugin
					break;
				case "profilecard":
				case "friendslist":
					// Reload CSS
					this.removeStyles();
					this.applyStyles();
					break;
				default:
					break;
				}
			});
			
			// Display settings panel
			return panel.getElement();
		}
		
		applyStyles() {
			// Chat message username styles (required - configured via applyUsername())
			PluginUtilities.addStyle(
				"DisplayUsernames-ChatMessage", 
				`
				/* style username in messages */
				.hg-username-handle {
					margin-left: 0.25rem;
					font-size: 0.75rem;
				}
				/* seperator dot */
				.hg-username-handle::after {
					margin-left: 0.25rem;
					content: "•";
				}
				/* fix timestamp margin (discord likes to change it randomly) */
				.roleDot_c01716, .cozy_f5c119 .headerText_f47574, .compact__54ecc .headerText_f47574 {
					margin-right: 0 !important;
				}
				/* change seperator in replies */
				.repliedMessage_e2bf4a > .hg-username-handle::after {
					margin-left: 0;
					content: ":  ";
				}
				/* hide username in command replies */
				.executedCommand_e8859a > .hg-username-handle {
					display: none;
				}
				`
			);
			// Display handle symbol infront of username in profile card/friends list
			if(this.settings.profilecard) PluginUtilities.addStyle(
				"DisplayUsernames-ProfileCard",
				`
				/* display handle symbol infront of username */
				.info__40462 > span::before, /* polmolo username */
				.nameTag__693ff > span.username__2cac3::before /* discriminator username */ {
					color: #777;
					content: "${this.settings.handlesymbol}";
				}
				/* hide handle symbol infront of nick in friends list */
				.username__81ee6::before {
					content: "" !important;
				}
				/* hide handle symbol infront of profile card in settings */
				div > .profileCardUsernameRow__4cbd8 > .info__40462 > span::before {
					content: "" !important;
				}
				`
			);
			// Always display usernames in friends list
			if(this.settings.friendslist) PluginUtilities.addStyle(
				"DisplayUsernames-FriendsList",
				`
				/* always show username in friends list */
				.discriminator_aef524 {
					visibility: visible !important;
				}
				`
			);
		}
		
		removeStyles() {
			PluginUtilities.removeStyle("DisplayUsernames-ChatMessage");
			PluginUtilities.removeStyle("DisplayUsernames-ProfileCard");
			PluginUtilities.removeStyle("DisplayUsernames-FriendsList");
		}
		
		applyUsername() {
			
			const [ module, key ] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byStrings("userOverride", "withMentionPrefix"), { searchExports: false });
			
			Patcher.after(module, key, (_, args, ret) => {
				let author = args[0].message.author;
				let discrim = author.discriminator;
				// Ensure this is not a webhook or system message
				if(discrim != "0000")
					ret.props.children.push(
						React.createElement("span", { class: "hg-username-handle" }, this.settings.handlesymbol + author.username + (discrim != "0" ? "#" + discrim : ""))
					);
			});
			
		}
		
	}
	
	return plugin;
	
})(global.ZeresPluginLibrary.buildPlugin(config));
