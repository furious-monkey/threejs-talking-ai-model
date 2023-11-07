import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { ConvaiClient } from "convai-web-sdk";
import { GetResponseResponse } from "convai-web-sdk/dist/Proto/service/service_pb";
import "./app.scss";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  InputToolbox,
  Button,
  ConversationHeader,
} from "@chatscope/chat-ui-kit-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons/faMicrophone";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons/faMicrophoneSlash";
import { faPlay } from "@fortawesome/free-solid-svg-icons/faPlay";
import { SETTINGS } from "./constants";

class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userMsg: "",
      messages: [],
    };
    this.handleMsgChange = this.handleMsgChange.bind(this);
    this.sendMsg = this.sendMsg.bind(this);
    this.reset = this.reset.bind(this);
    this.client = new ConvaiClient({
      apiKey: SETTINGS["CONVAI-API-KEY"],
      characterId: SETTINGS["CHARACTER-ID"],
      enableAudio: false,
      enableFacialData: true,
    });
    this.talkMsg = "Talk";
  }
  reset(event) {
    event.preventDefault();
    this.client.resetSession();
    this.setState({
      userMsg: "",
      messages: [],
    });
  }
  handleMsgChange(msg) {
    var messages = this.state.messages;
    this.setState({ userMsg: msg, messages: messages });
  }
  sendMsg(e) {
    console.log(e);
    var userMsg = this.state.userMsg;
    var responseText = "";
    var newMessages = this.state.messages;
    newMessages.push({ speaker: "Me", msg: userMsg });
    newMessages.push({ speaker: "NPC", msg: "..." });
    this.setState({
      userMsg: "",
      messages: newMessages,
    });

    this.client.setResponseCallback((response) => {
      console.log("Chat Box set response callback");
      if (response.hasAudioResponse()) {
        var newMessages = this.state.messages;
        newMessages.pop();
        responseText += response?.getAudioResponse()?.getTextData();
        console.log("AI: ", response?.getAudioResponse()?.getTextData());
        newMessages.push({ speaker: "NPC", msg: responseText });
        this.client.resetSession();
        this.setState({
          userMsg: "",
          messages: newMessages,
        });
      }
    });
    this.client.sendTextChunk(userMsg);
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "10px",
          width: "50%",
          maxWidth: "400px",
        }}
      >
        <MainContainer>
          <ChatContainer>
            <ConversationHeader>
              <ConversationHeader.Content userName="CONVAI-CHAT" />
              <ConversationHeader.Actions>
                <Button onClick={this.reset}>Reset</Button>
              </ConversationHeader.Actions>
            </ConversationHeader>
            <MessageList>
              {this.state.messages.map(function (msg, index) {
                return (
                  <Message
                    model={{
                      message: msg.msg,
                      sender: msg.speaker,
                      direction: msg.speaker == "Me" ? "outgoing" : "incoming",
                      position: "normal",
                    }}
                    key={index}
                  />
                );
              })}
            </MessageList>
          </ChatContainer>
        </MainContainer>
        <div className="cs-message-input">
          <MessageInput
            value={this.state.userMsg}
            onChange={this.handleMsgChange}
            sendButton={false}
            attachButton={false}
          />
          <InputToolbox>
            <Button
              onClick={this.sendMsg}
              icon={<FontAwesomeIcon icon={faPlay} />}
            />
          </InputToolbox>
        </div>
      </div>
    );
  }
}

export default ChatBox;
