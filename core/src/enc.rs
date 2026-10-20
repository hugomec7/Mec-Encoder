//! Importa presets `.enc` do Shutter Encoder (XML com `<Component><Name>…</Name><Value>…</Value>`).

use std::collections::HashMap;

use crate::preset::{Preset, Toggle};

fn unescape(s: &str) -> String {
    s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&apos;", "'").replace("&amp;", "&")
}

fn tag<'a>(block: &'a str, name: &str) -> Option<&'a str> {
    let open = format!("<{name}>");
    let close = format!("</{name}>");
    let a = block.find(&open)? + open.len();
    let b = block[a..].find(&close)? + a;
    Some(&block[a..b])
}

/// Lê os componentes: nome → (valor, ativado).
pub fn components(xml: &str) -> HashMap<String, (String, bool)> {
    let mut m = HashMap::new();
    for block in xml.split("<Component>").skip(1) {
        let block = block.split("</Component>").next().unwrap_or(block);
        let Some(name) = tag(block, "Name") else { continue };
        let value = tag(block, "Value").map(unescape).unwrap_or_default();
        let enabled = tag(block, "Enable").map_or(true, |e| e.trim() != "false");
        m.entry(name.trim().to_string()).or_insert((value.trim().to_string(), enabled));
    }
    m
}

/// "[iPhone] 4K60.enc" → "iPhone 4K60"
pub fn clean_name(file_name: &str) -> String {
    let base = file_name.trim_end_matches(".enc");
    base.replace(['[', ']'], " ").split_whitespace().collect::<Vec<_>>().join(" ")
}

fn slug(s: &str) -> String {
    let s: String = s.to_lowercase().chars().map(|c| if c.is_ascii_alphanumeric() { c } else { '-' }).collect();
    s.split('-').filter(|p| !p.is_empty()).collect::<Vec<_>>().join("-")
}

/// Converte um .enc em preset do Mec Encoder (só o que o Mec Encoder usa).
pub fn import(xml: &str, file_name: &str) -> Preset {
    let c = components(xml);
    let val = |k: &str| c.get(k).map(|(v, _)| v.as_str()).unwrap_or("");
    let on = |k: &str| c.get(k).map_or(false, |(v, e)| *e && v == "true");
    let name = clean_name(file_name);
    let mut p = Preset { id: format!("{}-{}", slug(&name), xml.len() % 9973), name: name.clone(), ..Preset::default() };

    p.codec = if val("comboFonctions").contains("264") { "h264".into() } else { "h265".into() };
    p.container = if val("comboFilter").to_lowercase().contains("mov") { "mov".into() } else { "mp4".into() };
    p.scale = match val("comboResolution") {
        s if s.starts_with("50") => "50".into(),
        s if s.starts_with("25") => "25".into(),
        s if s.contains("1080") || s.contains("1920") => "1080".into(),
        _ => "source".into(),
    };
    let br = val("debitVideo");
    match br.parse::<u32>() {
        Ok(k) if k > 0 => { p.bitrate.mode = "manual".into(); p.bitrate.kbps = k; }
        _ => { p.bitrate.mode = "auto".into(); p.bitrate.kbps = 0; }
    }
    p.bitrate.rc = if val("lblVBR").eq_ignore_ascii_case("VBR") { "vbr".into() } else { "cbr".into() };
    p.max_quality = on("caseQMax");
    p.fps.conform = on("caseConform");
    if !val("comboFPS").is_empty() { p.fps.value = val("comboFPS").replace(',', "."); }
    let colorimetry = on("caseColormatrix") && (val("comboInColormatrix").contains("2020") || val("comboInColormatrix") == "HDR");
    p.hdr_to_sdr = colorimetry;
    p.bits = if val("comboColorspace").contains("10bits") && on("caseColorspace") { 10 } else { 8 };

    p.audio.codec = if val("comboAudioCodec").eq_ignore_ascii_case("copy") { "copy".into() } else { "aac".into() };
    p.audio.channels = if val("lblAudioMapping").eq_ignore_ascii_case("mono") { "mono".into() } else { "stereo".into() };
    let track = |k: &str| val(k).trim_start_matches("Audio").trim().parse::<u32>().unwrap_or(1);
    p.audio.tracks = vec![track("comboAudio1"), track("comboAudio2")];
    if let Ok(k) = val("debitAudio").parse::<u32>() { if k > 0 { p.audio.kbps = k; } }

    p.output.suffix = Toggle { on: on("btnExtension"), text: val("txtExtension").to_string() };
    p.output.subfolder = Toggle { on: on("caseSubFolder"), text: if val("txtSubFolder").is_empty() { "proxy".into() } else { val("txtSubFolder").to_string() } };
    p.metadata = on("casePreserveMetadata");
    p.av_sync = true;

    let lname = name.to_lowercase();
    p.icon = if p.hdr_to_sdr { "hdr" } else if lname.contains("proxy") { "proxy" } else if lname.contains("iphone") { "phone" } else { "camera" }.into();
    p
}

#[cfg(test)]
mod tests {
    use super::*;
    const SAMPLE: &str = r#"<Shutter><Settings>
<Component><Type>JCheckBox</Type><Name>btnExtension</Name><Value>true</Value></Component>
<Component><Type>JTextField</Type><Name>txtExtension</Name><Value>_proxy</Value></Component>
<Component><Type>JCheckBox</Type><Name>caseSubFolder</Name><Value>false</Value></Component>
<Component><Type>JComboBox</Type><Name>comboFonctions</Name><Value>H.265</Value></Component>
<Component><Type>JComboBox</Type><Name>comboFilter</Name><Value>.mp4</Value></Component>
<Component><Type>JComboBox</Type><Name>comboResolution</Name><Value>25%</Value></Component>
<Component><Type>JComboBox</Type><Name>comboAudioCodec</Name><Value>Copy</Value></Component>
<Component><Type>JLabel</Type><Name>lblAudioMapping</Name><Value>Stereo</Value></Component>
<Component><Type>JComboBox</Type><Name>comboAudio1</Name><Value>Audio 1</Value></Component>
<Component><Type>JComboBox</Type><Name>comboAudio2</Name><Value>Audio 2</Value></Component>
<Component><Type>JCheckBox</Type><Name>caseConform</Name><Value>false</Value></Component>
<Component><Type>JComboBox</Type><Name>comboFPS</Name><Value>59,94</Value><Enable>false</Enable></Component>
<Component><Type>JTextField</Type><Name>debitVideo</Name><Value>auto</Value></Component>
<Component><Type>JLabel</Type><Name>lblVBR</Name><Value>VBR</Value></Component>
</Settings></Shutter>"#;

    #[test]
    fn imports_proxy_fx30() {
        let p = import(SAMPLE, "[PROXY FX30].enc");
        assert_eq!(p.name, "PROXY FX30");
        assert_eq!((p.codec.as_str(), p.scale.as_str(), p.bitrate.mode.as_str()), ("h265", "25", "auto"));
        assert_eq!(p.audio.codec, "copy");
        assert_eq!(p.audio.tracks, vec![1, 2]);
        assert!(p.output.suffix.on && p.output.suffix.text == "_proxy");
        assert!(!p.fps.conform);
        assert_eq!(p.icon, "proxy");
    }
}
