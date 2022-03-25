package com.weisong.backend.service.Comment;


import com.weisong.backend.entities.Comment.Comment;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
public interface CommentService {

    List<Comment> getCommentByArticleUuid(String articleUuid);

    void writeComment(Comment comment);

}
