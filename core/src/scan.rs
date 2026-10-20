//! Arquivos e pastas arrastados → lista de vídeos (subpastas incluídas).

use std::path::{Path, PathBuf};

pub const VIDEO_EXT: &[&str] = &["mov", "mp4", "m4v", "mxf", "mts", "m2ts", "avi", "mkv", "webm", "3gp", "hevc", "mpg", "mpeg", "wmv", "flv"];

#[derive(Clone, Debug, PartialEq)]
pub struct Found {
    pub path: PathBuf,
    /// Pasta de onde veio, relativa à pasta arrastada ("Day 3/Cam B"). Vazio se foi um arquivo solto.
    pub dir: String,
}

pub fn is_video(p: &Path) -> bool {
    p.extension().and_then(|e| e.to_str()).map_or(false, |e| VIDEO_EXT.contains(&e.to_ascii_lowercase().as_str()))
}

fn hidden(p: &Path) -> bool {
    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
    if name.starts_with('.') || name.starts_with("._") { return true; }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const HIDDEN: u32 = 0x2;
        const SYSTEM: u32 = 0x4;
        if let Ok(m) = std::fs::metadata(p) { if m.file_attributes() & (HIDDEN | SYSTEM) != 0 { return true; } }
    }
    false
}

/// Expande a seleção. Pastas são percorridas por completo, em ordem alfabética (natural).
pub fn expand(paths: &[PathBuf]) -> Vec<Found> {
    let mut out = Vec::new();
    for p in paths {
        if p.is_dir() {
            let root = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            walk(p, &root, &mut out, 0);
        } else if p.is_file() && is_video(p) {
            out.push(Found { path: p.clone(), dir: String::new() });
        }
    }
    let mut seen = std::collections::HashSet::new();
    out.retain(|f| seen.insert(f.path.clone()));
    out
}

fn walk(dir: &Path, rel: &str, out: &mut Vec<Found>, depth: usize) {
    if depth > 16 { return; }
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    let mut entries: Vec<PathBuf> = rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| !hidden(p)).collect();
    entries.sort_by(|a, b| natural(&a.to_string_lossy(), &b.to_string_lossy()));
    let (dirs, files): (Vec<_>, Vec<_>) = entries.into_iter().partition(|p| p.is_dir());
    for f in files { if is_video(&f) { out.push(Found { path: f, dir: rel.to_string() }); } }
    for d in dirs {
        let name = d.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        walk(&d, &format!("{rel}/{name}"), out, depth + 1);
    }
}

/// Ordem natural: IMG_9.MOV antes de IMG_10.MOV.
pub fn natural(a: &str, b: &str) -> std::cmp::Ordering {
    let (mut a, mut b) = (a.chars().peekable(), b.chars().peekable());
    loop {
        match (a.peek().copied(), b.peek().copied()) {
            (None, None) => return std::cmp::Ordering::Equal,
            (None, _) => return std::cmp::Ordering::Less,
            (_, None) => return std::cmp::Ordering::Greater,
            (Some(x), Some(y)) if x.is_ascii_digit() && y.is_ascii_digit() => {
                let mut na = String::new(); while let Some(c) = a.peek().copied().filter(char::is_ascii_digit) { na.push(c); a.next(); }
                let mut nb = String::new(); while let Some(c) = b.peek().copied().filter(char::is_ascii_digit) { nb.push(c); b.next(); }
                let (ta, tb) = (na.trim_start_matches('0'), nb.trim_start_matches('0'));
                let o = ta.len().cmp(&tb.len()).then(ta.cmp(tb));
                if o != std::cmp::Ordering::Equal { return o; }
            }
            (Some(x), Some(y)) => {
                let o = x.to_ascii_lowercase().cmp(&y.to_ascii_lowercase());
                if o != std::cmp::Ordering::Equal { return o; }
                a.next(); b.next();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn walks_subfolders() {
        let root = std::env::temp_dir().join(format!("mec-scan-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let day = root.join("Day 3");
        std::fs::create_dir_all(day.join("Cam B")).unwrap();
        for f in ["IMG_10.MOV", "IMG_9.mov", "notes.txt", ".hidden.mov"] { std::fs::write(day.join(f), b"x").unwrap(); }
        std::fs::write(day.join("Cam B").join("C0001.MP4"), b"x").unwrap();
        let found = expand(&[day.clone()]);
        let names: Vec<_> = found.iter().map(|f| (f.path.file_name().unwrap().to_string_lossy().into_owned(), f.dir.clone())).collect();
        assert_eq!(names, vec![
            ("IMG_9.mov".into(), "Day 3".into()),
            ("IMG_10.MOV".into(), "Day 3".into()),
            ("C0001.MP4".into(), "Day 3/Cam B".into()),
        ]);
        let _ = std::fs::remove_dir_all(&root);
    }
}
