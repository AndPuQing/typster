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

        SyntaxKind::Not => Some(Tag::Keyword),
        SyntaxKind::And => Some(Tag::Keyword),
        SyntaxKind::Or => Some(Tag::Keyword),
        SyntaxKind::None => Some(Tag::Keyword),
        SyntaxKind::Auto => Some(Tag::Keyword),
        SyntaxKind::Let => Some(Tag::Keyword),
        SyntaxKind::Set => Some(Tag::Keyword),
        SyntaxKind::Show => Some(Tag::Keyword),
        SyntaxKind::Context => Some(Tag::Keyword),
        SyntaxKind::If => Some(Tag::Keyword),
        SyntaxKind::Else => Some(Tag::Keyword),
        SyntaxKind::For => Some(Tag::Keyword),
        SyntaxKind::In => Some(Tag::Keyword),
        SyntaxKind::While => Some(Tag::Keyword),
        SyntaxKind::Break => Some(Tag::Keyword),
        SyntaxKind::Continue => Some(Tag::Keyword),
        SyntaxKind::Return => Some(Tag::Keyword),
        SyntaxKind::Import => Some(Tag::Keyword),
        SyntaxKind::Include => Some(Tag::Keyword),
        SyntaxKind::As => Some(Tag::Keyword),

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

fn highlight_tree(tokens: &mut Vec<u32>, node: &LinkedNode) {
    if let Some(tag) = highlight(node) {
        tokens.extend(EncodeToken::new(node, tag).encode());
    }
    for child in node.children() {
        highlight_tree(tokens, &child);
    }
}

fn get_line_number(source_text: &str, node: Vec<u32>) -> u32 {
    let start = node[1] as usize;
    let end = start + node[2] as usize;
    let mut line = 0;
    for (i, c) in source_text.chars().enumerate() {
        if i == end {
            break;
        }
        if c == '\n' {
            line += 1;
        }
    }
    line
}

pub fn tokenize(line: &str) -> Vec<u32> {
    let mut tokens = Vec::new();
    let root = parse(line);
    println!("{:?}", root);
    // Find all the Space tokens in the tree
    highlight_tree(&mut tokens, &LinkedNode::new(&root));

    // from the soucre code to get the line number
    for i in (0..tokens.len()).step_by(5) {
        tokens[i] = get_line_number(line, tokens[i..i + 5].to_vec());
    }
    // get all the tokens line number
    let lines = tokens.iter().step_by(5).collect::<Vec<_>>();

    let diffs: Vec<u32> = lines.windows(2).map(|w| w[1] - w[0]).collect();

    for i in 1..diffs.len() {
        tokens[i * 5] = diffs[i - 1];
    }

    // from the same line also use delta to place
    for i in (5..tokens.len()).step_by(5) {
        if tokens[i] == 0 {
            tokens[i + 1] = tokens[i + 1] - tokens[i - 4];
        }
    }

    tokens
}

#[test]
fn test_highlighting() {
    #[track_caller]
    fn test(text: &str) {
        let tokens = tokenize(text);
        println!("{:?}", tokens);
    }

    test("#let f(x) = x");

    test("#let f(x) = y");
}
