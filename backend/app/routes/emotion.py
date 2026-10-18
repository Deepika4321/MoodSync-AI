from fastapi import APIRouter, Request
from deepface import DeepFace
import base64
import cv2
import numpy as np
import traceback

router = APIRouter()


# =========================================================
# PRELOAD DEEPFACE EMOTION MODEL
# =========================================================




# =========================================================
# EMOTION DETECTION
# =========================================================

@router.post("/detect-emotion")
async def detect_emotion(request: Request):

    try:

        print("\n========================================")
        print("NEW EMOTION REQUEST")
        print("========================================")


        # =================================================
        # 1. READ JSON BODY
        # =================================================

        try:
            body = await request.json()

            print("Request received.")
            print("Body keys:", list(body.keys()))

        except Exception as e:

            print("JSON ERROR:", str(e))

            return {
                "success": False,
                "error": "Invalid JSON request."
            }


        # =================================================
        # 2. GET IMAGE
        # =================================================

        image_data = body.get("image")

        if not image_data:

            print("ERROR: image field missing.")

            return {
                "success": False,
                "error": "Image was not received."
            }


        if not isinstance(image_data, str):

            print("ERROR: image is not string.")

            return {
                "success": False,
                "error": "Invalid image format."
            }


        print("Image received.")
        print("Image string length:", len(image_data))


        # =================================================
        # 3. REMOVE BASE64 PREFIX
        # =================================================

        if "," in image_data:

            image_data = image_data.split(",", 1)[1]


        # =================================================
        # 4. DECODE BASE64
        # =================================================

        try:

            image_bytes = base64.b64decode(
                image_data,
                validate=True
            )

        except Exception as e:

            print("BASE64 ERROR:", str(e))

            return {
                "success": False,
                "error": "Invalid image data."
            }


        # =================================================
        # 5. CONVERT TO OPENCV
        # =================================================

        np_arr = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        img = cv2.imdecode(
            np_arr,
            cv2.IMREAD_COLOR
        )


        if img is None:

            print("ERROR: OpenCV could not decode image.")

            return {
                "success": False,
                "error": "Could not decode captured image."
            }


        print("Image decoded successfully.")
        print("Image shape:", img.shape)


        # =================================================
        # 6. DEEPFACE EMOTION ANALYSIS
        # =================================================

        print("Starting DeepFace emotion analysis...")

        try:

            result = DeepFace.analyze(
                img_path=img,
                actions=["emotion"],
                detector_backend="opencv",
                enforce_detection=False,
                align=True,
                silent=True
            )

        except Exception as e:

            print("OpenCV detector failed:")
            print(str(e))

            # ---------------------------------------------
            # FALLBACK TO RETINAFACE
            # ---------------------------------------------

            print("Trying RetinaFace fallback...")

            try:

                result = DeepFace.analyze(
                    img_path=img,
                    actions=["emotion"],
                    detector_backend="opencv",
                    enforce_detection=False,
                    align=True,
                    silent=True
                )

            except Exception as retina_error:

                print("RetinaFace failed:")
                print(str(retina_error))

                return {
                    "success": False,
                    "error": "Face could not be detected. Please face the camera properly and try again."
                }


        # =================================================
        # 7. HANDLE DEEPFACE RESULT
        # =================================================

        print("DeepFace analysis completed.")


        if isinstance(result, list):

            if len(result) == 0:

                return {
                    "success": False,
                    "error": "No face detected."
                }

            face_result = result[0]

        else:

            face_result = result


        # =================================================
        # 8. GET EMOTION
        # =================================================

        dominant_emotion = face_result.get(
            "dominant_emotion"
        )


        emotions = face_result.get(
            "emotion",
            {}
        )


        if not dominant_emotion:

            return {
                "success": False,
                "error": "Could not determine dominant emotion."
            }


        if not emotions:

            return {
                "success": False,
                "error": "Emotion scores were not returned."
            }


        # =================================================
        # 9. CONVERT SCORES
        # =================================================

        emotion_scores = {}

        for emotion, score in emotions.items():

            try:

                emotion_scores[emotion] = round(
                    float(score),
                    2
                )

            except Exception:

                emotion_scores[emotion] = 0.0


        # =================================================
        # 10. SORT EMOTIONS
        # =================================================

        sorted_emotions = dict(
            sorted(
                emotion_scores.items(),
                key=lambda item: item[1],
                reverse=True
            )
        )


        # =================================================
        # 11. CONFIDENCE
        # =================================================

        confidence = sorted_emotions.get(
            dominant_emotion,
            0.0
        )


        # =================================================
        # 12. PRINT RESULT
        # =================================================

        print("----------------------------------------")
        print("DOMINANT EMOTION:", dominant_emotion)
        print("CONFIDENCE:", confidence)
        print("ALL EMOTIONS:", sorted_emotions)
        print("----------------------------------------")


        # =================================================
        # 13. RETURN TO FRONTEND
        # =================================================

        return {

            "success": True,

            "emotion": dominant_emotion,

            "confidence": confidence,

            "emotions": sorted_emotions,

            "status": "Emotion detected successfully"

        }


    # =====================================================
    # UNEXPECTED ERROR
    # =====================================================

    except Exception as e:

        print("\n========================================")
        print("UNEXPECTED EMOTION ERROR")
        print("========================================")

        print(str(e))

        traceback.print_exc()

        print("========================================")


        return {

            "success": False,

            "error": str(e)

        }