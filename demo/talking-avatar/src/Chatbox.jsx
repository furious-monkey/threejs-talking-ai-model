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
      sessionId: "",
    };
    this.handleMsgChange = this.handleMsgChange.bind(this);
    this.sendMsg = this.sendMsg.bind(this);
    this.talky = this.talky.bind(this);
    this.reset = this.reset.bind(this);
    this.client = this.props.client;
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
  talky(event) {
    event.preventDefault();
    var messages = this.state.messages;
    var userMsg = this.state.userMsg;
    if (this.talkMsg == "Talk") {
      this.talkMsg = "Stop Talking";
      this.setState({ userMsg: userMsg, messages: messages });
      var responseText = "";
      var finalUserText = "";
      var tempUserText = "";
      var newMessages = this.state.messages;
      newMessages.push({ speaker: "Me", msg: "..." });
      this.setState({
        userMsg: "",
        messages: newMessages,
      });

      this.client.setResponseCallback((response) => {
        if (response.hasUserQuery()) {
          var userQuery = response.getUserQuery();
          var textData = userQuery?.getTextData();
          var newMessages = this.state.messages;
          if (textData != "") {
            if (userQuery?.getTextData)
              if (userQuery?.getIsFinal()) {
                finalUserText += userQuery.getTextData();
                tempUserText = "";
              } else {
                tempUserText = userQuery.getTextData();
              }
            newMessages.pop();
            newMessages.push({
              speaker: "Me",
              msg: finalUserText + tempUserText,
            });
          }
          if (userQuery?.getEndOfResponse()) {
            newMessages.push({ speaker: "NPC", msg: "..." });
          }
          this.setState({
            userMsg: "",
            messages: newMessages,
          });
        }
        if (response.hasAudioResponse()) {
          var newMessages = this.state.messages;
          newMessages.pop();
          responseText += response?.getAudioResponse()?.getTextData();
          newMessages.push({ speaker: "NPC", msg: responseText });
          this.setState({
            userMsg: "",
            messages: newMessages,
          });
        }
      });
      this.client.startAudioChunk();
    } else {
      this.talkMsg = "Talk";
      this.client.endAudioChunk();
      this.client.resetSession();
      this.setState({ userMsg: userMsg, messages: messages });
    }
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
      if (response.hasAudioResponse()) {
        var newMessages = this.state.messages;
        newMessages.pop();
        responseText += response?.getAudioResponse()?.getTextData();
        newMessages.push({ speaker: "NPC", msg: responseText });
        this.setState({
          userMsg: "",
          messages: newMessages,
          sessionId: response.getSessionId(),
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
          <InputToolbox>
            <Button
              onClick={this.talky}
              icon={
                <FontAwesomeIcon
                  icon={
                    this.talkMsg == "Talk" ? faMicrophoneSlash : faMicrophone
                  }
                />
              }
            ></Button>
          </InputToolbox>
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
