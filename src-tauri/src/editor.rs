use serde::Deserialize;
use serde::Serialize;
use typst_syntax::ast;
use typst_syntax::parse;
use typst_syntax::LinkedNode;
use typst_syntax::SyntaxKind;

/// A syntax highlighting tag.
/// Copy from typst_syntax::highlight module
/// And we add some other tag.
#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
pub enum Tag {
    /// A line or block comment.
    Comment,
    /// Punctuation in code.
    Punctuation,
    /// An escape sequence or shorthand.
    Escape,
    /// Strong markup.
    Strong,
    /// Emphasized markup.
    Emph,
    /// A hyperlink.
    Link,
    /// Raw text.
    Raw,
    /// A label.
    Label,
    /// A reference to a label.
    Ref,
    /// A section heading.
    Heading,
    /// A marker of a list, enumeration, or term list.
    ListMarker,
    /// A term in a term list.
    ListTerm,
    /// The delimiters of an equation.
    MathDelimiter,
    /// An operator with special meaning in an equation.
    MathOperator,
    /// A keyword.
    Keyword,
    /// An operator in code.
    Operator,
    /// A numeric literal.
    Number,
    /// A string literal.
    String,
    /// A function or method name.
    Function,
    /// An interpolated variable in markup or math.
    Interpolated,
    /// A syntax error.
    Error,
}

impl Tag {
    /// The list of all tags, in the same order as thy are defined.
    ///
    /// Can be used as the counter-part to `tag as usize`.
    pub const LIST: &'static [Tag] = &[
        Self::Comment,
        Self::Punctuation,
        Self::Escape,
        Self::Strong,
        Self::Emph,
        Self::Link,
        Self::Raw,
        Self::Label,
        Self::Ref,
        Self::Heading,
        Self::ListMarker,
        Self::ListTerm,
        Self::MathDelimiter,
        Self::MathOperator,
        Self::Keyword,
        Self::Operator,
        Self::Number,
        Self::String,
        Self::Function,
        Self::Interpolated,
        Self::Error,
    ];

    /// Return the recommended TextMate grammar scope for the given highlighting
    /// tag.
    pub fn tm_scope(&self) -> &'static str {
        match self {
            Self::Comment => "comment.typst",
            Self::Punctuation => "punctuation.typst",
            Self::Escape => "constant.character.escape.typst",
            Self::Strong => "markup.bold.typst",
            Self::Emph => "markup.italic.typst",
            Self::Link => "markup.underline.link.typst",
            Self::Raw => "markup.raw.typst",
            Self::MathDelimiter => "punctuation.definition.math.typst",
            Self::MathOperator => "keyword.operator.math.typst",
            Self::Heading => "markup.heading.typst",
            Self::ListMarker => "punctuation.definition.list.typst",
            Self::ListTerm => "markup.list.term.typst",
            Self::Label => "entity.name.label.typst",
            Self::Ref => "markup.other.reference.typst",
            Self::Keyword => "keyword.typst",
            Self::Operator => "keyword.operator.typst",
            Self::Number => "constant.numeric.typst",
            Self::String => "string.quoted.double.typst",
            Self::Function => "entity.name.function.typst",
            Self::Interpolated => "meta.interpolation.typst",
            Self::Error => "invalid.typst",
        }
    }
}

/// Highlight a hash based on context.
fn highlight_hash(node: &LinkedNode) -> Option<Tag> {
    let next = node.next_sibling()?;
    let expr = next.cast::<ast::Expr>()?;
    if !expr.hash() {
        return None;
    }
    highlight(&next.leftmost_leaf()?)
}

/// Whether the node is one of the two identifier nodes.
fn is_ident(node: &LinkedNode) -> bool {
    matches!(node.kind(), SyntaxKind::Ident | SyntaxKind::MathIdent)
}

/// Highlight an identifier based on context.
fn highlight_ident(node: &LinkedNode) -> Option<Tag> {
    // Are we directly before an argument list?
    let next_leaf = node.next_leaf();
    if let Some(next) = &next_leaf {
        if node.range().end == next.offset()
            && ((next.kind() == SyntaxKind::LeftParen
                && matches!(
                    next.parent_kind(),
                    Some(SyntaxKind::Args | SyntaxKind::Params)
                ))
                || (next.kind() == SyntaxKind::LeftBracket
                    && next.parent_kind() == Some(SyntaxKind::ContentBlock)))
        {
            return Some(Tag::Function);
        }
    }

    // Are we in math?
    if node.kind() == SyntaxKind::MathIdent {
        return Some(Tag::Interpolated);
    }

    // Find the first non-field access ancestor.
    let mut ancestor = node;
    while ancestor.parent_kind() == Some(SyntaxKind::FieldAccess) {
        ancestor = ancestor.parent()?;
    }

    // Are we directly before or behind a show rule colon?
    if ancestor.parent_kind() == Some(SyntaxKind::ShowRule)
        && (next_leaf.map(|leaf| leaf.kind()) == Some(SyntaxKind::Colon)
            || node.prev_leaf().map(|leaf| leaf.kind()) == Some(SyntaxKind::Colon))
    {
        return Some(Tag::Function);
    }

    // Are we (or an ancestor field access) directly after a hash.
    if ancestor.prev_leaf().map(|leaf| leaf.kind()) == Some(SyntaxKind::Hash) {
        return Some(Tag::Interpolated);
    }

    // Are we behind a dot, that is behind another identifier?
    let prev = node.prev_leaf()?;
    if prev.kind() == SyntaxKind::Dot {
        let prev_prev = prev.prev_leaf()?;
        if is_ident(&prev_prev) {
            return highlight_ident(&prev_prev);
        }
    }

    None
}

fn highlight(node: &LinkedNode) -> Option<Tag> {
    match node.kind() {
        SyntaxKind::Markup
            if node.parent_kind() == Some(SyntaxKind::TermItem)
                && node.next_sibling_kind() == Some(SyntaxKind::Colon) =>
        {
            Some(Tag::ListTerm)
        }
        SyntaxKind::Markup => None,
        SyntaxKind::Text => None,
        SyntaxKind::Space => None,
        SyntaxKind::Linebreak => Some(Tag::Escape),
        SyntaxKind::Parbreak => None,
        SyntaxKind::Escape => Some(Tag::Escape),
        SyntaxKind::Shorthand => Some(Tag::Escape),
        SyntaxKind::SmartQuote => None,
        SyntaxKind::Strong => Some(Tag::Strong),
        SyntaxKind::Emph => Some(Tag::Emph),
        SyntaxKind::Raw => Some(Tag::Raw),
        SyntaxKind::RawLang => None,
        SyntaxKind::RawTrimmed => None,
        SyntaxKind::RawDelim => None,
        SyntaxKind::Link => Some(Tag::Link),
        SyntaxKind::Label => Some(Tag::Label),
        SyntaxKind::Ref => Some(Tag::Ref),
        SyntaxKind::RefMarker => None,
        SyntaxKind::Heading => Some(Tag::Heading),
        SyntaxKind::HeadingMarker => None,
        SyntaxKind::ListItem => None,
        SyntaxKind::ListMarker => Some(Tag::ListMarker),
        SyntaxKind::EnumItem => None,
        SyntaxKind::EnumMarker => Some(Tag::ListMarker),
        SyntaxKind::TermItem => None,
        SyntaxKind::TermMarker => Some(Tag::ListMarker),
        SyntaxKind::Equation => None,

        SyntaxKind::Math => None,
        SyntaxKind::MathIdent => highlight_ident(node),
        SyntaxKind::MathAlignPoint => Some(Tag::MathOperator),
        SyntaxKind::MathDelimited => None,
        SyntaxKind::MathAttach => None,
        SyntaxKind::MathFrac => None,
        SyntaxKind::MathRoot => None,
        SyntaxKind::MathPrimes => None,

        SyntaxKind::Hash => highlight_hash(node),
        SyntaxKind::LeftBrace => Some(Tag::Punctuation),
        SyntaxKind::RightBrace => Some(Tag::Punctuation),
        SyntaxKind::LeftBracket => Some(Tag::Punctuation),
        SyntaxKind::RightBracket => Some(Tag::Punctuation),
        SyntaxKind::LeftParen => Some(Tag::Punctuation),
        SyntaxKind::RightParen => Some(Tag::Punctuation),
        SyntaxKind::Comma => Some(Tag::Punctuation),
        SyntaxKind::Semicolon => Some(Tag::Punctuation),
        SyntaxKind::Colon => Some(Tag::Punctuation),
        SyntaxKind::Star => match node.parent_kind() {
            Some(SyntaxKind::Strong) => None,
            _ => Some(Tag::Operator),
        },
        SyntaxKind::Underscore => match node.parent_kind() {
            Some(SyntaxKind::MathAttach) => Some(Tag::MathOperator),
            _ => None,
        },
        SyntaxKind::Dollar => Some(Tag::MathDelimiter),
        SyntaxKind::Plus => Some(Tag::Operator),
        SyntaxKind::Minus => Some(Tag::Operator),
        SyntaxKind::Slash => Some(match node.parent_kind() {
            Some(SyntaxKind::MathFrac) => Tag::MathOperator,
            _ => Tag::Operator,
        }),
        SyntaxKind::Hat => Some(Tag::MathOperator),
        SyntaxKind::Prime => Some(Tag::MathOperator),
        SyntaxKind::Dot => Some(Tag::Punctuation),
        SyntaxKind::Eq => match node.parent_kind() {
            Some(SyntaxKind::Heading) => None,
            _ => Some(Tag::Operator),
        },
        SyntaxKind::EqEq => Some(Tag::Operator),
        SyntaxKind::ExclEq => Some(Tag::Operator),
        SyntaxKind::Lt => Some(Tag::Operator),
        SyntaxKind::LtEq => Some(Tag::Operator),
        SyntaxKind::Gt => Some(Tag::Operator),
        SyntaxKind::GtEq => Some(Tag::Operator),
        SyntaxKind::PlusEq => Some(Tag::Operator),
        SyntaxKind::HyphEq => Some(Tag::Operator),
        SyntaxKind::StarEq => Some(Tag::Operator),
        SyntaxKind::SlashEq => Some(Tag::Operator),
        SyntaxKind::Dots => Some(Tag::Operator),
        SyntaxKind::Arrow => Some(Tag::Operator),
        SyntaxKind::Root => Some(Tag::MathOperator),

        SyntaxKind::Not
        | SyntaxKind::And
        | SyntaxKind::Or
        | SyntaxKind::None
        | SyntaxKind::Auto
        | SyntaxKind::Let
        | SyntaxKind::Set
        | SyntaxKind::Show
        | SyntaxKind::Context
        | SyntaxKind::If
        | SyntaxKind::Else
        | SyntaxKind::For
        | SyntaxKind::In
        | SyntaxKind::While
        | SyntaxKind::Break
        | SyntaxKind::Continue
        | SyntaxKind::Return
        | SyntaxKind::Import
        | SyntaxKind::Include
        | SyntaxKind::As => Some(Tag::Keyword),

        SyntaxKind::Code => None,
        SyntaxKind::Ident => highlight_ident(node),
        SyntaxKind::Bool => Some(Tag::Keyword),
        SyntaxKind::Int => Some(Tag::Number),
        SyntaxKind::Float => Some(Tag::Number),
        SyntaxKind::Numeric => Some(Tag::Number),
        SyntaxKind::Str => Some(Tag::String),
        SyntaxKind::CodeBlock => None,
        SyntaxKind::ContentBlock => None,
        SyntaxKind::Parenthesized => None,
        SyntaxKind::Array => None,
        SyntaxKind::Dict => None,
        SyntaxKind::Named => None,
        SyntaxKind::Keyed => None,
        SyntaxKind::Unary => None,
        SyntaxKind::Binary => None,
        SyntaxKind::FieldAccess => None,
        SyntaxKind::FuncCall => None,
        SyntaxKind::Args => None,
        SyntaxKind::Spread => None,
        SyntaxKind::Closure => None,
        SyntaxKind::Params => None,
        SyntaxKind::LetBinding => None,
        SyntaxKind::SetRule => None,
        SyntaxKind::ShowRule => None,
        SyntaxKind::Contextual => None,
        SyntaxKind::Conditional => None,
        SyntaxKind::WhileLoop => None,
        SyntaxKind::ForLoop => None,
        SyntaxKind::ModuleImport => None,
        SyntaxKind::ImportItems => None,
        SyntaxKind::RenamedImportItem => None,
        SyntaxKind::ModuleInclude => None,
        SyntaxKind::LoopBreak => None,
        SyntaxKind::LoopContinue => None,
        SyntaxKind::FuncReturn => None,
        SyntaxKind::Destructuring => None,
        SyntaxKind::DestructAssignment => None,

        SyntaxKind::LineComment => Some(Tag::Comment),
        SyntaxKind::BlockComment => Some(Tag::Comment),
        SyntaxKind::Error => Some(Tag::Error),
        SyntaxKind::Eof => None,
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct EncodeToken {
    line: u32,
    start_char: u32,
    length: u32,
    token_type: u32,
    token_modifiers: u32,
}

impl EncodeToken {
    pub fn new(node: &LinkedNode, tag: Tag) -> Self {
        Self {
            line: u32::MAX,
            start_char: node.offset() as u32,
            length: node.len() as u32,
            token_type: tag as u32,
            token_modifiers: 0,
        }
    }
    pub fn encode(&self) -> Vec<u32> {
        vec![
            self.line,
            self.start_char,
            self.length,
            self.token_type,
            self.token_modifiers,
        ]
    }
}

fn highlight_tree(tokens: &mut Vec<EncodeToken>, node: &LinkedNode) {
    if let Some(tag) = highlight(node) {
        // tokens.extend(EncodeToken::new(node, tag).encode());
        tokens.push(EncodeToken::new(node, tag));
    }
    for child in node.children() {
        highlight_tree(tokens, &child);
    }
}

pub fn get_token_legend() -> Vec<String> {
    Tag::LIST
        .iter()
        .map(|tag| tag.tm_scope().to_string())
        .collect()
}

pub fn tokenize(line: &str) -> Vec<u32> {
    let mut tokens = Vec::new();
    let root = parse(line);
    highlight_tree(&mut tokens, &LinkedNode::new(&root));
    let mut extra_tokens: Vec<EncodeToken> = Vec::new();
    for i in 0..tokens.len() {
        tokens[i].line = 0;
        let line_number = line[..tokens[i].start_char as usize]
            .chars()
            .filter(|&c| c == '\n')
            .count();
        tokens[i].line = line_number as u32;

        let inner_string: Vec<&str> = line
            [tokens[i].start_char as usize..(tokens[i].start_char + tokens[i].length) as usize]
            .split('\n')
            .collect();

        // fix multi-line token (like comment, string, etc.)
        // append the extra token to the end of the token list
        if inner_string.len() > 1 {
            for j in 1..inner_string.len() {
                extra_tokens.push(EncodeToken {
                    line: line_number as u32 + j as u32,
                    start_char: 0,
                    length: inner_string[j].len() as u32,
                    token_type: tokens[i].token_type,
                    token_modifiers: tokens[i].token_modifiers,
                });
            }
            tokens[i].length = inner_string[0].len() as u32;
        }
        // fix start char
        if line_number > 0 {
            tokens[i].start_char = tokens[i].start_char
                - line[..tokens[i].start_char as usize].rfind('\n').unwrap() as u32
                - 1;
        }
    }

    tokens.extend(extra_tokens);
    // sort by line number and start char
    tokens.sort_by(|a, b| {
        if a.line == b.line {
            a.start_char.cmp(&b.start_char)
        } else {
            a.line.cmp(&b.line)
        }
    });

    // get all the tokens line number
    let lines = tokens.iter().map(|t| t.line).collect::<Vec<_>>();
    let diffs: Vec<u32> = lines.windows(2).map(|w| w[1] - w[0]).collect();
    for i in 0..diffs.len() {
        tokens[i + 1].line = diffs[i];
    }

    let start_chars: Vec<u32> = tokens.iter().map(|t| t.start_char).collect();
    let diffs: Vec<i32> = start_chars
        .windows(2)
        .map(|w| w[1] as i32 - w[0] as i32)
        .collect();

    for i in 0..diffs.len() {
        if tokens[i + 1].line == 0 {
            tokens[i + 1].start_char = diffs[i] as u32;
        }
    }

    tokens.iter().flat_map(|t| t.encode()).collect()
}

#[test]
fn test_highlighting() {
    #[track_caller]
    fn test(text: &str) {
        let tokens = tokenize(text);
        for i in (0..tokens.len()).step_by(5) {
            println!(
                "{:?} {:?} {:?} {:?} {:?}",
                tokens[i],
                tokens[i + 1],
                tokens[i + 2],
                tokens[i + 3],
                tokens[i + 4]
            );
        }
    }

    // test("#let f(x) = x");

    // test("#let f(x) = y");

    test("#let f(x) = y\n#let g(x) = z");

    test("/* \n comment */");
}
