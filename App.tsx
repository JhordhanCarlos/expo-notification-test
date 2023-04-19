import { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform, TextInput } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { styles } from "./src/styles";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Can use this function below OR use Expo's Push Notification Tool from: https://expo.dev/notifications

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_APP_ID,
      })
    ).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function sendPushNotification(expoPushToken) {
    if (textTitle === "" || textBody === "") {
      return alert("Type the text on both fields to recieve an notification");
    }

    const message = {
      to: expoPushToken,
      sound: "default",
      title: textTitle,
      body: textBody,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    setTextTitle("");
    setTextBody("");
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff" }}>
        Allow notifications in your settings.
      </Text>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Enter the title"
          placeholderTextColor={"#eee"}
          value={textTitle}
          onChangeText={setTextTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter the body"
          placeholderTextColor={"#eee"}
          value={textBody}
          onChangeText={setTextBody}
        />
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification(expoPushToken);
        }}
      />
    </View>
  );
}
