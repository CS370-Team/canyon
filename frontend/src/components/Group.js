import { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { AuthContext } from "../store/auth";
import { InfoContext } from "../store/info";
import { styles } from "../styles/Group";
import { colors } from "../styles/colors";
import Question from "./Question";
import { Exit, Invite } from "./Svg";

//
// no such thing as q
//
//

export default function Group({ group }) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState(group.issueFrequency); // time until next question
  const timerRef = useRef(timer);
  const token = useContext(AuthContext)[0];
  const groups = useContext(InfoContext)[0];
  const setGroups = useContext(InfoContext)[1];

  const questions = [
    { id: 0, key: "What is your earliest memory?" },
    { id: 1, key: "What area in your life are you looking to improve?" },
    {
      id: 2,
      key: "What is something that is important to you that you never really talk about?",
    },
    { id: 3, key: "What motivates you?" },
    { id: 4, key: "What's the best advice you've ever received?" },
    {
      id: 5,
      key: "What's a deep or difficult question you've been pondering lately?",
    },
    {
      id: 6,
      key: "How would you describe your approach to your career so far?",
    },
    {
      id: 7,
      key: "What's something you're absolutely convinced is going to happen in the future?",
    },
    { id: 8, key: "What's something you recently learned?" },
  ];

  // const [question, setQuestion] = useState();
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [data, setData] = useState(questions);
  const [randomQuestions, setRandomQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  // updates timerRef with the current timer value
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]); // runs whenever timer changes

  useEffect(() => {
    setData(questions);
    startTimer();
  }, []);

  const startTimer = () => {
    if (group.issues.length === 0) {
      setTimer(0);
    } else {
      const lastIssueTime = new Date(group.issues[group.issues.length - 1].time);
      const currentTime = new Date();
      const currentTimeUTC = new Date( // incredibly jank but it works
        currentTime.getUTCFullYear(),
        currentTime.getUTCMonth(),
        currentTime.getUTCDate(),
        currentTime.getUTCHours(),
        currentTime.getUTCMinutes(),
        currentTime.getUTCSeconds(),
        currentTime.getUTCMilliseconds()
      );

      const timeElapsed = Math.floor((currentTimeUTC - lastIssueTime) / 1000);
      
      const initialTimer = Math.max(group.issueFrequency - timeElapsed, 0);
      setTimer(initialTimer);
    }

    const interval = setInterval(() => {
      if (timerRef.current > 0) {
        setTimer((timer) => timer - 1);
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleQuestionOpen = () => {
    onChecked("");
    setSelectedQuestion("");
    setQuestionOpen(true);
    // select 3 random ids from data
    setRandomQuestions(
      data
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((item) => item.id)
    );
  };

  const handleNewQuestion = () => {
    createIssue(selectedQuestion);
    setQuestionSubmitted(true);
  };

  const createIssue = async () => {
    const url = `http://joincanyon.org/issues`;
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        groupId: group.id,
        question: selectedQuestion,
      }),
    };
    try {
      const response = await fetch(url, options)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
          }
          return response;
        })
        .then((data) => {
          return data.json();
        });

      const groupIndex = groups.findIndex((g) => g.id === group.id);
      groups[groupIndex].issues.push(response);
      setGroups([...groups]);
      startTimer();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const onChecked = (text) => {
    // Update data with new checked states
    setSelectedQuestion(text);
    const newData = data.map((item) => {
      if (item.key === text) {
        // Toggle the checked state of the selected item
        const updatedItem = { ...item, checked: !item.checked };
        if (!updatedItem.checked) {
          setSelectedQuestion("");
        }
        return updatedItem;
      } else {
        // Ensure all other items are not checked
        return { ...item, checked: false };
      }
    });

    // Set the new data state
    setData(newData);
  };

  renderQuestions = () => {
    return !questionSubmitted ? (
      data.map((item) => {
        return (
          // only render questions if item.id is in randomQuestions
          randomQuestions.includes(item.id) && (
            <TouchableOpacity
              key={item.id}
              style={!item.checked ? groupStyles.box : groupStyles.boxChecked}
              onPress={() => {
                onChecked(item.key);
              }}
            >
              <Text style={groupStyles.options}>{item.key}</Text>
            </TouchableOpacity>
          )
        );
      })
    ) : (
      <Text
        style={[
          styles.subheading,
          { alignSelf: "center", textAlign: "center" },
        ]}
      >
        New question created! 🎉
      </Text>
    );
  };

  const onShare = async () => {
    try {
      const result = await Share.share({
        title: "New Canyon Question! 🎉",
        // url: "https://reactnative.dev/docs/share?language=javascript",
        message: `New question in Canyon @ ${group.name}! \n\n${selectedQuestion}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setQuestionOpen(false);
      setSelectedQuestion("");
      setQuestionSubmitted(false);
    }
  };

  const inviteFriends = async () => {
    try {
      const result = await Share.share({
        title: "Join Canyon!",
        // url: "https://reactnative.dev/docs/share?language=javascript",
        message: `Join my group on Canyon with this invite code. \n${group.id}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={{ width: "100%" }}>
      <TouchableOpacity
        style={[
          styles.subcontainer,
          timer === 0 ? { backgroundColor: colors.primary } : {},
        ]}
        onPress={() => {
          setOpen(true);
        }}
      >
        <View style={styles.paneContent}>
          <Text style={[styles.subheading, { color: colors.secondary }]}>
            {group.name}
          </Text>
          <Text style={styles.paragraph} numberOfLines={1} ellipsizeMode="tail">
            {group.issues[0]
              ? group.issues[group.issues.length - 1].question
              : "No questions yet, start a conversation!"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.body}>
            <View style={styles.exit}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Exit color={colors.textPrimary} scale={1.5} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.title, { color: colors.primary }]}>
              {group.name}
            </Text>

            <View style={styles.content}>
              {/* new question button, grayed if unavailable, highlighted if available */}
              <TouchableOpacity
                style={[
                  styles.button,
                  timer === 0
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: "gray" },
                ]}
                onPress={handleQuestionOpen}
                disabled={timer !== 0}
              >
                <Text style={{ color: "white" }}>Create new question</Text>
              </TouchableOpacity>
              <Text style={[styles.note, { alignSelf: "center" }]}>
                Next question available in {timer} seconds
              </Text>

              {questionOpen ? (
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={questionOpen}
                  onRequestClose={() => {
                    setQuestionOpen(false);
                    setSelectedQuestion("");
                    setQuestionSubmitted(false);
                  }}
                >
                  <Pressable
                    style={styles.centeredView}
                    onPress={() => {
                      setQuestionOpen(false);
                      setQuestionSubmitted(false);
                    }}
                  >
                    <KeyboardAvoidingView
                      behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                      <View
                        style={styles.modalView}
                        onStartShouldSetResponder={() => true}
                      >
                        <View style={[styles.content, { marginVertical: 0 }]}>
                          {!questionSubmitted ? (
                            <View>
                              <Text
                                style={[
                                  groupStyles.textStyle,
                                  { paddingTop: 0 },
                                ]}
                              >
                                Create a new question! 🎉 🙌
                              </Text>
                            </View>
                          ) : null}
                          {this.renderQuestions()}
                          {questionSubmitted ? (
                            <Text style={styles.paragraph}>
                              {selectedQuestion}
                            </Text>
                          ) : null}
                          {!questionSubmitted ? (
                            <>
                              <TextInput
                                style={styles.input}
                                placeholder="Or, write your own question!"
                                placeholderTextColor={colors.textSecondary}
                                onChangeText={setSelectedQuestion}
                                value={selectedQuestion}
                              />
                              <Pressable
                                style={[
                                  styles.button,
                                  selectedQuestion !== ""
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.textPrimary },
                                ]}
                                onPress={
                                  selectedQuestion !== ""
                                    ? handleNewQuestion
                                    : () => {}
                                }
                              >
                                <Text style={{ textAlign: "center" }}>
                                  Select Question
                                </Text>
                              </Pressable>
                            </>
                          ) : (
                            <Pressable
                              style={[
                                styles.button,
                                { backgroundColor: colors.primary },
                              ]}
                              onPress={onShare}
                            >
                              <Text style={{ textAlign: "center" }}>
                                Share Via Text Now!
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </KeyboardAvoidingView>
                  </Pressable>
                </Modal>
              ) : (
                <></>
              )}

              {/* people */}
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 15,
                  alignItems: "center",
                }}
              >
                <Text style={[styles.subheading, { alignSelf: "flex-start" }]}>
                  People
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setInviteOpen(true);
                  }}
                >
                  <Invite color={colors.secondary} />
                </TouchableOpacity>
              </View>

              {inviteOpen ? (
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={inviteOpen}
                  onRequestClose={() => setInviteOpen(false)}
                >
                  <Pressable
                    style={styles.centeredView}
                    onPress={() => {
                      setInviteOpen(false);
                    }}
                  >
                    {/* onStartShouldSetResponder ignores pressable's onPress for modal content */}
                    <View
                      style={styles.modalView}
                      onStartShouldSetResponder={() => true}
                    >
                      <Pressable
                        style={groupStyles.invite}
                        onPress={inviteFriends}
                      >
                        <Text style={{ fontWeight: "bold" }}>
                          Invite friends
                        </Text>
                      </Pressable>
                      <Text
                        style={[
                          styles.title,
                          { fontWeight: "normal", fontSize: 16 },
                        ]}
                      >
                        Or use your group code:
                        <Text style={{ color: colors.secondary }}>
                          {" " + group.id}
                        </Text>
                      </Text>
                    </View>
                  </Pressable>
                </Modal>
              ) : (
                <></>
              )}

              <View style={styles.subcontent}>
                <Text style={styles.paragraph}>
                  {group.members.map((member) => member.name).join(", ")}
                </Text>
              </View>

              {/* previous questions */}
              <Text
                style={[
                  styles.subheading,
                  { alignSelf: "flex-start", paddingTop: 10 },
                ]}
              >
                Previous Questions
              </Text>
              <Text
                style={[
                  styles.note,
                  { fontWeight: "bold", fontSize: 16, color: "#fff" },
                ]}
              >
                Select a question and view the group's responses 🥰
              </Text>
              {[...group.issues]
                .reverse()
                .slice(1)
                .map((q) => (
                  <Question key={q.id} question={q} />
                ))}
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const groupStyles = {
  container: {
    backgroundColor: "#121418",
    flex: 1,
  },
  row: {
    flexDirection: "column",
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2029",
    // margin: 10,
    padding: 10,
    paddingBottom: 10,
    borderRadius: 4,
    width: "100%",
  },
  boxChecked: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1bf73",
    // backgroundColor: colors.secondary,
    color: "#000",
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 4,
    paddingLeft: 10,
    width: "100%",
  },
  textStyle: {
    fontWeight: "bold",
    paddingTop: 20,
    fontSize: 18,
    color: "#FFFFFF",
  },
  subTextStyle: {
    paddingBottom: 10,
    fontSize: 18,
    color: "#FFFFFF",
  },
  tinyImg: {
    width: 18,
    height: 18,
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
  },
  options: {
    marginRight: 20,
    fontSize: 16,
    color: "#fff",
  },
  text: {
    margin: 15,
    fontSize: 16,
    color: "white",
  },
  sched: {
    width: "48%",
    padding: 10,
    color: "black",
    borderRadius: 8,
    marginRight: 10,
  },
  invite: {
    padding: 10,
    color: "black",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: 10,
    marginTop: 20,
  },
};
