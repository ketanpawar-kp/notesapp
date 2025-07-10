/* notesapp/src/App.jsx */

import React, { useEffect, useState } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {
  Authenticator,
  Heading,
  View,
  Image,
  Flex,
  Text,
  TextField,
  TextAreaField,
  Button,
  useTheme,
} from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { getUrl, uploadData } from "aws-amplify/storage";
import config from "../amplify_outputs.json";

import { Amplify } from "aws-amplify";
Amplify.configure(config);

const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [noteData, setNoteData] = useState({
    name: "",
    description: "",
    image: null,
  });

  const fetchNotes = async () => {
    const { data } = await client.models.Note.list();
    const notesWithUrls = await Promise.all(
      data.map(async (note) => {
        if (note.image) {
          const { url } = await getUrl({ path: note.image });
          return { ...note, imageUrl: url };
        }
        return note;
      })
    );
    setNotes(notesWithUrls);
  };

  const createNote = async () => {
    if (!noteData.name || !noteData.description) return;

    let imagePath = null;
    if (noteData.image) {
      imagePath = `media/${Date.now()}-${noteData.image.name}`;
      await uploadData({
        path: imagePath,
        data: noteData.image,
      }).result;
    }

    await client.models.Note.create({
      name: noteData.name,
      description: noteData.description,
      image: imagePath,
    });

    setNoteData({ name: "", description: "", image: null });
    fetchNotes();
  };

  const deleteNote = async (id) => {
    await client.models.Note.delete({ id });
    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const { tokens } = useTheme();

  return (
    <Authenticator>
      {({ signOut }) => (
        <View className="App">
          <Flex direction="column" padding={tokens.space.large}>
            <Heading level={1}>My Notes</Heading>

            <TextField
              label="Note Name"
              value={noteData.name}
              onChange={(e) => setNoteData({ ...noteData, name: e.target.value })}
            />
            <TextAreaField
              label="Description"
              value={noteData.description}
              onChange={(e) => setNoteData({ ...noteData, description: e.target.value })}
            />
            <input
              type="file"
              onChange={(e) => setNoteData({ ...noteData, image: e.target.files[0] })}
            />
            <Button variation="primary" onClick={createNote} marginTop={tokens.space.medium}>
              Create Note
            </Button>

            <Flex wrap="wrap" gap="1rem" marginTop={tokens.space.large}>
              {notes.map((note) => (
                <View key={note.id} className="card" width="30%">
                  <Heading level={4}>{note.name}</Heading>
                  <Text>{note.description}</Text>
                  {note.imageUrl && <Image src={note.imageUrl} alt={note.name} />}
                  <Button variation="destructive" onClick={() => deleteNote(note.id)}>
                    Delete
                  </Button>
                </View>
              ))}
            </Flex>

            <Button variation="link" onClick={signOut} marginTop={tokens.space.large}>
              Sign Out
            </Button>
          </Flex>
        </View>
      )}
    </Authenticator>
  );
}

export default App;
