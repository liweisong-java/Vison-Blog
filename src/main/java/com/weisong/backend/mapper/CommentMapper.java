package com.weisong.backend.mapper;

import com.weisong.backend.entities.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-03-07-20:50
 */
@Mapper
@Repository
public interface CommentMapper {

    //    查询所有文章
    List<Comment> getCommentByArticleUuid(@Param("article_uuid") String articleUuid);

//    写评论
    void writeComment(@Param("user_uuid")String userUuid,@Param("article_uuid")String articleUuid,@Param("comment")String comment,@Param("comment_time")String commentTime);
}
