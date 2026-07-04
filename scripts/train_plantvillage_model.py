"""
PlantDX - PlantVillage Model Eğitim Scripti
=============================================
Gerçek MobileNetV2 transfer learning ile PlantVillage veri setinden
38 sınıflı bitki hastalığı sınıflandırıcı eğitir ve TensorFlow.js
formatına dönüştürür (web/kamera modülünde çevrimdışı kullanım için).

Kullanım:
    pip install tensorflow tensorflowjs
    python train_plantvillage_model.py --data_dir ./plantvillage_dataset --epochs 15

Veri seti (PlantVillage, 38 sınıf, ~54000 görüntü):
    https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
Kaggle'dan indirip data_dir altına 'train/' ve 'valid/' klasörleriyle yerleştirin
(klasör isimleri = sınıf isimleri, ImageFolder yapısı).

ÖNEMLİ: Bu script bir iskelet/gerçek eğitim pipeline'ıdır. Gerçek model ağırlıkları
bu repo içinde YOKTUR (54.000+ görüntülük veri seti + saatlerce GPU eğitimi gerektirir).
Eğittikten sonra çıktı `public/models/plantvillage_web_model/` altına kopyalanmalı,
kamera modülü bu klasörü bulursa gerçek çevrimdışı analiz otomatik aktif olur.
Model dosyası yoksa uygulama dürüstçe "çevrimdışı analiz kullanılamıyor" mesajı gösterir.
"""

import argparse
import os

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator


def build_model(num_classes: int, img_size: int = 224) -> tf.keras.Model:
    base = MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # ilk aşama: sadece üst katmanları eğit

    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base


def fine_tune(model: tf.keras.Model, base: tf.keras.Model, unfreeze_from: int = 100):
    base.trainable = True
    for layer in base.layers[:unfreeze_from]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, required=True)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--fine_tune_epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--img_size", type=int, default=224)
    parser.add_argument("--output_dir", type=str, default="./trained_model")
    args = parser.parse_args()

    train_dir = os.path.join(args.data_dir, "train")
    valid_dir = os.path.join(args.data_dir, "valid")

    train_gen = ImageDataGenerator(
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode="nearest",
    )
    valid_gen = ImageDataGenerator()

    train_flow = train_gen.flow_from_directory(
        train_dir, target_size=(args.img_size, args.img_size), batch_size=args.batch_size, class_mode="categorical"
    )
    valid_flow = valid_gen.flow_from_directory(
        valid_dir, target_size=(args.img_size, args.img_size), batch_size=args.batch_size, class_mode="categorical"
    )

    num_classes = train_flow.num_classes
    class_indices = train_flow.class_indices  # {class_name: index}
    class_names = [None] * num_classes
    for name, idx in class_indices.items():
        class_names[idx] = name

    model, base = build_model(num_classes, args.img_size)

    print(f"Aşama 1: Üst katmanlar eğitiliyor ({args.epochs} epoch)...")
    model.fit(train_flow, validation_data=valid_flow, epochs=args.epochs)

    print(f"Aşama 2: Fine-tuning ({args.fine_tune_epochs} epoch)...")
    model = fine_tune(model, base)
    model.fit(train_flow, validation_data=valid_flow, epochs=args.fine_tune_epochs)

    os.makedirs(args.output_dir, exist_ok=True)
    model.save(os.path.join(args.output_dir, "plantvillage_model.keras"))

    with open(os.path.join(args.output_dir, "class_names.json"), "w", encoding="utf-8") as f:
        import json
        json.dump(class_names, f, ensure_ascii=False, indent=2)

    print("Eğitim tamamlandı. TensorFlow.js formatına dönüştürmek için:")
    print(
        f"  tensorflowjs_converter --input_format=keras "
        f"{args.output_dir}/plantvillage_model.keras "
        f"../public/models/plantvillage_web_model"
    )
    print(f"  cp {args.output_dir}/class_names.json ../public/models/plantvillage_web_model/")


if __name__ == "__main__":
    main()
