#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

FONT="/tmp/fonts/Amiri-Bold.ttf"
OUT="attached_assets/generated_videos/shelan_promo_ar_final.mp4"
V1="attached_assets/generated_videos/shelan_clip1_intro.mp4"
V2="attached_assets/generated_videos/shelan_clip2_plan.mp4"
V3="attached_assets/generated_videos/shelan_clip3_wellness.mp4"
V4="attached_assets/generated_videos/shelan_clip4_success.mp4"
V5="attached_assets/generated_videos/shelan_clip5_cta.mp4"
LOGO="public/logo.png"
VO="attached_assets/generated_audio/shelan_voiceover_ar.mp3"
MUSIC="attached_assets/generated_audio/music_shelan_promo_music_bed.mp3"

TXT1="تصوّري جسدك... متجدد وخفيف"
TXT2="خطة غذائية شخصية علمية"
TXT3="رعاية متخصصة لحالات الليبيديما"
TXT4="+10 سنوات خبرة وقصص نجاح حقيقية"
TXT5="احجزي استشارتك الآن"

ffmpeg -y \
  -i "$V1" -i "$V2" -i "$V3" -i "$V4" -i "$V5" -loop 1 -t 5 -i "$LOGO" -i "$VO" -i "$MUSIC" \
  -filter_complex "
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v0];
[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v1];
[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v2];
[3:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v3];
[4:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v4];
[v0][v1]xfade=transition=fade:duration=0.6:offset=5.4[x1];
[x1][v2]xfade=transition=fade:duration=0.6:offset=10.8[x2];
[x2][v3]xfade=transition=fade:duration=0.6:offset=16.2[x3];
[x3][v4]xfade=transition=fade:duration=0.6:offset=21.6[x4];
[x4]drawtext=fontfile=${FONT}:text='${TXT1}':fontcolor=white:fontsize=58:box=1:boxcolor=0x8E3B46@0.55:boxborderw=22:x=(w-text_w)/2:y=h*0.78:enable='between(t,0.3,5.4)',
drawtext=fontfile=${FONT}:text='${TXT2}':fontcolor=white:fontsize=58:box=1:boxcolor=0x8E3B46@0.55:boxborderw=22:x=(w-text_w)/2:y=h*0.78:enable='between(t,5.8,10.8)',
drawtext=fontfile=${FONT}:text='${TXT3}':fontcolor=white:fontsize=54:box=1:boxcolor=0x8E3B46@0.55:boxborderw=22:x=(w-text_w)/2:y=h*0.78:enable='between(t,11.2,16.2)',
drawtext=fontfile=${FONT}:text='${TXT4}':fontcolor=white:fontsize=54:box=1:boxcolor=0x8E3B46@0.55:boxborderw=22:x=(w-text_w)/2:y=h*0.78:enable='between(t,16.6,21.6)',
drawtext=fontfile=${FONT}:text='${TXT5}':fontcolor=white:fontsize=62:box=1:boxcolor=0x8E3B46@0.7:boxborderw=26:x=(w-text_w)/2:y=h*0.72:enable='between(t,22.0,27.6)'[vtxt];
[5:v]scale=320:-1,format=rgba,fps=30[logo];
[vtxt][logo]overlay=x=(main_w-overlay_w)/2:y=h*0.42:enable='between(t,23.0,27.6)'[vout];
[6:a]adelay=1000|1000,apad[voa];
[7:a]atrim=0:27.6,volume=0.16,afade=t=out:st=25.6:d=2[mus];
[voa][mus]amix=inputs=2:duration=first:dropout_transition=2,atrim=0:27.6,afade=t=out:st=26.1:d=1.5[aout]
" \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -shortest \
  "$OUT"

echo "DONE: $OUT"
